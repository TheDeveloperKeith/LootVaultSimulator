package com.example.lootvaultproject.Config;

import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultEntity.Wallet;
import com.example.lootvaultproject.VaultRepository.WalletRepository;
import com.example.lootvaultproject.VaultRepository.LedgerEntryRepository;
import com.example.lootvaultproject.VaultService.WalletService;
import org.junit.jupiter.api.*;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.lang.reflect.Proxy;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

class DevModeTest {
    private final UUID id=UUID.randomUUID();
    private DevMode gate(boolean enabled, String... profiles) {
        var environment=new MockEnvironment(); environment.setActiveProfiles(profiles);
        return new DevMode(enabled,"private test phrase",environment);
    }
    private void authenticate(Object principal, String role) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(principal,null,List.of(new SimpleGrantedAuthority(role))));
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void onlyExplicitDevProfileWithPhraseEnablesEntry() {
        assertFalse(gate(false,"dev").enabled()); assertFalse(gate(true).enabled());
        assertFalse(gate(true,"dev","prod").enabled()); assertFalse(gate(true,"dev","production").enabled());
        assertFalse(gate(true,"dev").accepts("wrong")); assertFalse(gate(true,"dev").accepts(null));
        assertTrue(gate(true,"dev").accepts("private test phrase"));
    }
    @Test void ordinaryPrincipalOrAnotherPlayersIdentityCannotBypassWallet() {
        var gate=gate(true,"dev");
        authenticate("ordinary-player","ROLE_DEV"); assertFalse(gate.isTestPlayer(id));
        authenticate(new DevMode.TestIdentity(UUID.randomUUID(),"dev_other"),"ROLE_DEV"); assertFalse(gate.isTestPlayer(id));
        authenticate(new DevMode.TestIdentity(id,"dev_test"),"ROLE_USER"); assertFalse(gate.isTestPlayer(id));
        authenticate(new DevMode.TestIdentity(id,"dev_test"),"ROLE_DEV"); assertTrue(gate.isTestPlayer(id));
    }
    @Test void testWalletNeverDebitsOrAccumulatesPayoutsButNormalWalletStillDoes() {
        Wallet wallet=new Wallet(id,DevMode.TEST_BALANCE,0L);
        var ledgerWrites=new AtomicInteger();
        var wallets=(WalletRepository)Proxy.newProxyInstance(WalletRepository.class.getClassLoader(),new Class[]{WalletRepository.class},(proxy,method,args)->{
            if((method.getName().equals("findByPlayerId") || method.getName().equals("findByPlayerIdWithLock"))) return Optional.of(wallet);
            if(method.getName().equals("save")) return args[0];
            throw new UnsupportedOperationException(method.getName());
        });
        var ledger=(LedgerEntryRepository)Proxy.newProxyInstance(LedgerEntryRepository.class.getClassLoader(),new Class[]{LedgerEntryRepository.class},(proxy,method,args)->{
            if(method.getName().equals("save")) { ledgerWrites.incrementAndGet(); return args[0]; }
            throw new UnsupportedOperationException(method.getName());
        });
        var service=new WalletService(wallets,ledger,gate(true,"dev"));
        authenticate(new DevMode.TestIdentity(id,"dev_test"),"ROLE_DEV");
        service.debit(id,CurrencyType.SOFT,100L,"TEST",UUID.randomUUID());
        service.creditWithReason(id,CurrencyType.SOFT,500L,"TEST",UUID.randomUUID());
        assertEquals(DevMode.TEST_BALANCE,wallet.getSoftBalance()); assertEquals(0,ledgerWrites.get());
        assertTrue(service.getWallet(id).isUnlimited());
        authenticate("ordinary-player","ROLE_USER");
        service.debit(id,CurrencyType.SOFT,100L,"TEST",UUID.randomUUID());
        assertEquals(DevMode.TEST_BALANCE-100,wallet.getSoftBalance()); assertEquals(1,ledgerWrites.get());
        assertFalse(service.getWallet(id).isUnlimited());
    }
}

package com.example.lootvaultproject.VaultService;
/** Shared by displayed odds and server rolls. Secret chance never receives a boost. */
public final class BannerOdds {
 private BannerOdds() {}
 public static double secret(boolean hasSecret) { return hasSecret ? .0001 : 0; }
 public static double featured(boolean hasSecret,double multiplier) {
  if(multiplier!=1 && multiplier!=2.5 && multiplier!=5.5) throw new IllegalArgumentException("Invalid luck multiplier.");
  return (hasSecret ? .0099 : .01)*multiplier;
 }
 public static double standard(boolean hasSecret,double multiplier) { return 1-secret(hasSecret)-featured(hasSecret,multiplier); }
}

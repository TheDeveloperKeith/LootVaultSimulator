import {execFileSync} from "node:child_process";
import {readFileSync,mkdirSync,existsSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {randomUUID} from "node:crypto";
function settings(file) { if(!existsSync(file))return {};return Object.fromEntries(readFileSync(file,"utf8").split(/\r?\n/).filter(line=>line.includes("=")&&!line.trim().startsWith("#")).map(line=>{const i=line.indexOf("=");return [line.slice(0,i).trim(),line.slice(i+1).trim().replace(/^['"]|['"]$/g,"")];})); }
const local=settings("application-local.properties"),env={...settings(".env"),...process.env};
const value=(property,key,fallback)=>local[property] && !local[property].startsWith("${") ? local[property] : env[key] || fallback;
const url=new URL(value("spring.datasource.url","DB_URL","jdbc:postgresql://localhost:5433/lootvault").replace(/^jdbc:/,""));
const username=value("spring.datasource.username","DB_USERNAME",env.POSTGRES_USER || "lootvault");
const password=value("spring.datasource.password","DB_PASSWORD",env.POSTGRES_PASSWORD || "");
if(!password)throw new Error("Configure a database password privately before running a backup.");
const binaryRoot=env.PG_BIN || "C:/Program Files/PostgreSQL/16/bin";
const native=name=>join(binaryRoot,process.platform==="win32"?name+".exe":name);
const processEnv={...process.env,PGHOST:url.hostname,PGPORT:url.port || "5432",PGUSER:username,PGPASSWORD:password,PGSSLMODE:url.searchParams.get("sslmode") || "prefer"};
const run=(name,args)=>execFileSync(native(name),args,{env:processEnv,encoding:"utf8",stdio:["ignore","pipe","pipe"]});
const database=decodeURIComponent(url.pathname.slice(1));
const folder=resolve(".backups");mkdirSync(folder,{recursive:true});
const timestamp=new Date().toISOString().replace(/[:.]/g,"-");
const archive=join(folder,`lootvault-${timestamp}.dump`);
const counts="SELECT json_build_object('players',(SELECT count(*) FROM players),'wallets',(SELECT count(*) FROM wallets),'ledger',(SELECT count(*) FROM ledger_entries),'items',(SELECT count(*) FROM inventory_items),'rounds',(SELECT count(*) FROM earn_rounds),'migrations',(SELECT count(*) FROM flyway_schema_history));";
const before=run("psql",["--dbname",database,"-tA","-c",counts]).trim();
run("pg_dump",["--dbname",database,"--format=custom","--no-owner","--no-acl","--file",archive]);
run("pg_restore",["--list",archive]);
let restoreVerified=false;
if(process.argv.includes("--verify-restore")) {
 const temporary=`lootvault_restorecheck_${randomUUID().replaceAll("-","")}`;
 if(temporary===database || !/^lootvault_restorecheck_[a-f0-9]{32}$/.test(temporary))throw new Error("Unsafe restore destination.");
 let created=false;
 try {run("createdb",[temporary]);created=true;run("pg_restore",["--dbname",temporary,"--no-owner","--no-acl","--exit-on-error",archive]);
   const restored=run("psql",["--dbname",temporary,"-tA","-c",counts]).trim();
   if(restored!==before)throw new Error("Restored row counts differ. The source may have changed during the dump; investigate before using this backup.");
   restoreVerified=true;
 } finally {if(created)run("dropdb",[temporary]);}
}
writeFileSync(join(folder,`verification-${timestamp}.json`),JSON.stringify({createdAt:new Date().toISOString(),archive,restoreVerified,coreTableCounts:JSON.parse(before)},null,2));
console.log(`Backup archive created. ${restoreVerified ? "Full restore and six core table counts verified in a disposable database; verification database removed." : "Archive contents validated. Run with --verify-restore for a full disposable restore check."}`);
console.log(`Private archive: ${archive}`);

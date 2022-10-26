#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {setConfigValue, getConfigValue} from './config.js';
import {downloadMod} from './downloadmod.js';

yargs(hideBin(process.argv))
.command({
	command: "moddir",
	describe: "Set the directory to download mods to",
	builder: {
		dir: {
			type: "string",
			describe: "The directory to download mods to",
			alias: "d"
		}
	},
	handler: (argv) => {
		if(argv.dir){
			setConfigValue({modDir: argv.dir});
		}
		else console.log(`Current mod directory: ${getConfigValue("modDir")}`);
	}
})
.command({
	command: "download",
	describe: "Download a mod",
	builder: {
		search: {
			type: "string",
			describe: "The name of the mod to download",
			alias: "s"
		}
	},
	handler: (argv) => {
		if(argv.search){
			console.log("Downloading mod: " + argv.search);
			downloadMod(argv.search);
		}
		else console.log("No search term provided");
	}
})
.command({
	command: "setup",
	describe: "Initial setup for fmm",
	
})
.help()
.argv
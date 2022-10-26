#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {setConfigValue, getConfigValue} from './config.js';
import {downloadMod} from './downloadmod.js';
import * as readline from 'node:readline/promises';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {getFabricVersions} from './files.js';
import { updateMods } from './update.js';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

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
		process.exit();
	}
})
.command({
	command: "download",
	describe: "Download a mod",
	builder: {
		query: {
			type: "string",
			describe: "The name/id of the mod to download",
			alias: "q"
		}
	},
	handler: async (argv) => {
		if(argv.query){
			await downloadMod(argv.query.replaceAll(" ", "-"));
		}
		else console.log("No search term or id provided");
		process.exit();
	}
})
.command({
	command: "setup",
	describe: "Initial setup for fmm",
	handler: async () => {
		console.log(chalk.bold("Welcome to Fabric Mod Manager setup!"));
		console.log("To begin, you need to obtain a curseforge api key.")
		let answer = await rl.question(`Go to ${chalk.underline("https://console.curseforge.com/#/api-keys")} and paste your key below. (you may need to hit ctrl+shift+v)\n`);
		if(answer) setConfigValue({curseforgeKey: answer});
		
		answer = await rl.question(`What directory would you like to download mods to? (Leave blank for ${process.env.APPDATA}\\.minecraft\\mods)\n`)
		|| `${process.env.APPDATA}\\.minecraft\\mods`;
		setConfigValue({modDir: answer});

		// search for fabric versions
		let versions = getFabricVersions();

		let answers = await inquirer.prompt([
			{
				type: "list",
				name: "version",
				message: "Which version of fabric would you like to use?",
				choices: versions.reverse()
			}
		])
		setConfigValue({fabricVersion: answers.version});
		console.log(chalk.green("Setup complete!"));
		rl.close();
		process.exit();
	}
})
.command({
	command: "version",
	describe: "Set or get the fabric version",
	builder: {
		ver: {
			type: "string",
			describe: "The version of fabric to use",
		}
	},
	handler: async (argv) => {
		if(argv.ver){
			let versions = getFabricVersions();
			if(!versions.includes(argv.ver)){
				let answer = await rl.question(chalk.yellow(`Version ${argv.ver} was not found. Continue anyways? (y/N) `));
				if(answer.toLowerCase() !== "y") process.exit();
			}

			await updateMods(argv.ver);

			console.log(chalk.green("Fabric version updated!"));
		}else{
			console.log(`Current fabric version: ${getConfigValue("fabricVersion")}`);
		}
		process.exit();
	}
})
.command({
	command: "key",
	describe: "Set your curseforge api key",
	builder: {
		key: {
			type: "string",
			describe: "Your curseforge api key",
			alias: "k"
		}
	},
	handler: async (argv) => {
		if(argv.key){
			setConfigValue({curseforgeKey: argv.key});
			console.log(chalk.green("Key updated!"));
		}else{
			console.log("You need to specify a key with --key!");
		}
		process.exit();
	}
})
.demandCommand()
.argv
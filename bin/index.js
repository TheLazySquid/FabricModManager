#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {setConfigValue, getConfigValue} from './config.js';
import {downloadMod, uninstallMod} from './downloadmod.js';
import * as readline from 'node:readline/promises';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {getFabricVersions} from './files.js';
import { updateMods, updateModDir } from './update.js';
import fs from 'fs';

export const inq = inquirer;

export const rl = readline.createInterface({
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
			updateModDir(argv.dir)
		}
		else console.log(`Current mod directory: ${getConfigValue("modDir")}`);
		process.exit();
	}
})
.command({
	command: "install",
	describe: "Install a mod",
	builder: {
		query: {
			type: "string",
			describe: "The name/id of the mod to install",
			alias: "q"
		}
	},
	handler: async (argv) => {
		if(argv.query){
			await downloadMod(argv.query.replaceAll(" ", "-"), {});
		}
		else console.log("No search term or id provided");
		process.exit();
	}
})
.command({
	command: "uninstall",
	describe: "Uninstall a mod",
	builder: {
		query: {
			type: "string",
			describe: "The name/id of the mod to uninstall",
			alias: "q"
		}
	},
	handler: async (argv) => {
		if(argv.query){
			await uninstallMod(argv.query.replaceAll(" ", "-"));
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
		let answer = await rl.question(`Go to ${chalk.underline("https://console.curseforge.com/#/api-keys")} and paste your key below. (you may need to hit ctrl+shift+v or right click)\n`);
		if(answer) setConfigValue({curseforgeKey: answer});
		
		answer = await rl.question(`What directory would you like to download mods to? (Leave blank for ${process.env.APPDATA}\\.minecraft\\mods)\n`)
		|| `${process.env.APPDATA}\\.minecraft\\mods`;
		await updateModDir(answer);

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
.command({
	command: "list",
	describe: "List all installed mods",
	handler: async () => {
		console.table(getConfigValue("mods"));
		process.exit();
	}
})
.command({
	command: "reinstall",
	describe: "Reinstall all missing mods",
	builder: {
		force: {
			type: "boolean",
			describe: "Reinstall mods that already exist",
			alias: "f"
		}
	},
	handler: async (argv) => {
		let mods = getConfigValue("mods");
		let moddir = getConfigValue("modDir");
		let redownloadedMods = 0;
		for(let mod of mods){
			// check if mod exists
			if(!fs.existsSync(`${moddir}\\${mod.fileName}`) || argv.force){
				await downloadMod(mod.modID, {force: argv.force});
				redownloadedMods++;
			}
		}
		console.log(chalk.green(`Redownloaded ${redownloadedMods} mods`));
		process.exit();
	}
})
.command({
	command: "disable",
	describe: "Disable a mod for use later",
	// builder: 
})
.demandCommand()
.argv
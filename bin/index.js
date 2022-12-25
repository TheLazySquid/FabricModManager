import yargs from "yargs";
import fs from "fs";
import { hideBin } from "yargs/helpers";
import { getConfigValue, setConfigValue } from "./config.js";
import { installModrinthMod, triggerModFunction } from "./manager.js";
import chalk from "chalk";
import { loadMods } from "./utils.js";

yargs(hideBin(process.argv))
.command({
	command: "install",
	aliases: ["i"],
	describe: "Install a mod",
	builder: {
		query: {
			type: "string",
			describe: "The name/ID of the mod to install",
			alias: "q"
		}
	},
	handler: (argv) => {
		if(!argv.query){
			console.log(chalk.red("Error: ") + "No query provided.");
			return;
		}
		installModrinthMod(argv.query);
	}
})
.command({
	command: "moddir",
	aliases: ["m"],
	describe: "Set the mod directory",
	builder: {
		path: {
			type: "string",
			describe: "The path to the mod directory",
			alias: "p"
		}
	},
	handler: (argv) => {
		if(!argv.path){
			// output the current mod directory
			console.log("Current mod directory: " + getConfigValue("modDir"));
			return
		}
		// set the mod directory
		if(fs.existsSync(argv.path)){
			console.log(chalk.green("Mod directory set to: " + argv.path));
			setConfigValue("modDir", argv.path);
		}else{
			console.log(chalk.red("Error: ") + "Mod directory does not exist.");
		}
	}
})
.command({
	command: "list",
	aliases: ["l"],
	describe: "List installed mods",
	handler: () => {
		// get the list of mods
		let mods = getConfigValue("mods");
		if(!mods) mods = [];

		// output the list with console.table, while removing activeVersionIndex and versions from the output
		console.table(mods.map((mod) => {
			let {versions, activeVersionIndex, ...rest} = mod;
			return rest;
		}));
	}
})
.command({
	command: "version",
	aliases: ["v"],
	describe: "Set the version of fabric to use",
	builder: {
		ver: {
			type: "string",
			describe: "The version of fabric to use",
			alias: "v"
		}
	},
	handler: async (argv) => {
		if(!argv.ver){
			// output the current version
			console.log("Current version: " + getConfigValue("version") || "not set");
			return
		}
		// set the version
		setConfigValue("version", argv.ver);

		// update all mods
		let mods = loadMods();
		for(let mod of mods){
			console.log(chalk.green("Updating mod: ") + mod.title);
			let index = await mod.updateVersion();
			await mod.swapVersion(index);
		}
	}
})
.command({
	command: "uninstall",
	aliases: ["u"],
	describe: "Uninstall a mod",
	builder: {
		query: {
			type: "string",
			describe: "The name/id of the mod to uninstall",
			alias: "q"
		}
	},
	handler: (argv) => {
		if(!argv.query){
			console.log(chalk.red("Error: ") + "No mod specified.");
			return;
		}
		triggerModFunction(argv.query, "delete");
	}
})
.command({
	command: "disable",
	aliases: ["d"],
	describe: "Disable a mod for use later",
	builder: {
		query: {
			type: "string",
			describe: "The name/id of the mod to disable",
			alias: "q"
		}
	},
	handler: async (argv) => {
		if(!argv.query){
			console.log(chalk.red("Error: ") + "No mod specified.");
			return;
		}
		triggerModFunction(argv.query, "disable");
	}
})
.command({
	command: "enable",
	aliases: ["e"],
	describe: "Enable a mod",
	builder: {
		query: {
			type: "string",
			describe: "The name/id of the mod to enable",
			alias: "q"
		}
	},
	handler: async (argv) => {
		if(!argv.query){
			console.log(chalk.red("Error: ") + "No mod specified.");
			return;
		}
		triggerModFunction(argv.query, "enable");
	}
})
.demandCommand()
.help()
.argv;
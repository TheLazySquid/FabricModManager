import yargs from "yargs";
import fs from "fs";
import { hideBin } from "yargs/helpers";
import { config } from "./config.js";
import { createCustomMod, installCurseForgeMod, installModrinthMod, searchAllPlatforms, triggerModFunction } from "./manager.js";
import chalk from "chalk";

import inquirer from "inquirer";

// export inquirer for use in other files
export { inquirer };

// if no profile exists, create one
if(!config.activeProfile){
	let res = await inquirer.prompt([
		{
			type: "input",
			name: "name",
			message: "What would you like to name your profile?",
			default: "default",
			validate: (input) => {
				if(input.length < 1){
					return "Please enter a name for your profile";
				}
				return true;
			}
		}
	])
	config.createProfile(res.name);
}
// if no mod directory is set, set it
if(!config.getConfigValue("modDir")){
	let res = await inquirer.prompt([
		{
			type: "input",
			name: "path",
			message: "What folder would you like to download mods to?",
			default: process.env.APPDATA + "/.minecraft/mods",
			validate: (input) => {
				if(!fs.existsSync(input)){
					return "That folder does not exist";
				}
				return true;
			}
		}
	])
	config.setConfigValue("modDir", res.path);
}

yargs(hideBin(process.argv))
.command({
	command: "install [type]",
	describe: "Install a mod",
	aliases: ["i"],
	builder: {
		query: {
			type: "string",
			describe: "The name/id of the mod to install",
			alias: "q"
		}
	},
	handler: async (argv) => {
		if(!argv.query){
			console.log(chalk.red("Error: ") + "No mod specified! use 'fmm install -q <modID/slug>");
			return;
		}

		let type = argv.type?.toLowerCase();
		if(type == "modrinth" || type == "m"){
			installModrinthMod(argv.query);
		}else if(type == "curseforge" || type == "curse" || type == "c"){
			installCurseForgeMod(argv.query);
		}else{
			searchAllPlatforms(argv.query);
		}
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
			console.log("Current mod directory: " + config.getConfigValue("modDir"));
			return
		}
		// set the mod directory
		if(fs.existsSync(argv.path)){
			let oldModDir = config.getConfigValue("modDir")
			config.setConfigValue("modDir", argv.path);

			// move all .jar files from the old mod directory to the new one
			let files = fs.readdirSync(oldModDir);
			for(let file of files){
				if(file.endsWith(".jar")){
					fs.renameSync(oldModDir + "/" + file, argv.path + "/" + file);
				}
			}

			// move the fmm_unused folder
			if(fs.existsSync(oldModDir + "\\fmm_unused")){
				fs.renameSync(oldModDir + "\\fmm_unused", argv.path + "\\fmm_unused");
			}
			console.log(chalk.green("Mod directory set to: " + argv.path));
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
		let mods = config.getConfigValue("mods");
		if(!mods) mods = [];

		// output the list with console.table, while removing activeVersionIndex and versions from the output
		console.table(mods.map((mod) => {
			let {versions, activeVersionIndex, ...rest} = mod;
			return rest;
		}));
	}
})
.command({
	command: "version [ver]",
	aliases: ["v"],
	describe: "Set the version of fabric to use",
	handler: async (argv) => {
		if(!argv.ver){
			// output the current version
			console.log(`Current version for profile ${config.activeProfile.name}: ${config.activeProfile.version || "not set"}`);
			return
		}
		// set the version
		config.activeProfile.setConfigValue("version", argv.ver);
		console.log(chalk.green("Version set to: " + argv.ver));

		// update all mods
		let mods = config.activeProfile.loadMods();
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
		config.activeProfile.disableMod(argv.query);
	}
})
.command({
	command: "enable",
	aliases: ["e"],
	describe: "Enable a mod",
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
		config.activeProfile.enableMod(argv.query);
	}
})
.command({
	command: "key <platform> <key>",
	describe: "Set the API key for a platform",
	handler: (argv) => {
		if(!argv.platform || !argv.key){
			console.log(chalk.red("Error: ") + "No platform or key specified.");
			return;
		}
		let platforms = ["curseforge"];
		if(!platforms.includes(argv.platform)){
			console.log(chalk.red("Error: ") + "Invalid platform specified. It needs to be one of: " + platforms.join(", "));
			return;
		}
		config.setAPIKey(argv.platform, argv.key);
	}
})
.command({
	command: "loader [loader]",
	describe: "Set your mod loader of choice. Currently supports Fabric, Forge and Quilt",
	handler: async (argv) => {
		if(!argv.loader){
			console.log("Current loader: " + config.getConfigValue("loader") || "not set");
			return;
		}
		const loaders = ["fabric", "forge", "quilt"];
		if(!loaders.includes(argv.loader?.toLowerCase())){
			console.log(chalk.red("Error: ") + "Invalid loader specified. It needs to be one of: " + loaders.join(", "));
			return;
		}
		config.activeProfile.setConfigValue("loader", argv.loader);
		console.log(chalk.green("Loader set to: ") + argv.loader);

		// update all mods
		let mods = config.activeProfile.loadMods();

		for(let mod of mods){
			console.log(chalk.green("Updating mod: ") + mod.title);
			let index = await mod.updateVersion();
			if(index == null) continue;
			await mod.swapVersion(index);
		}
	}
})
.command({
	command: "reinstall",
	describe: "Reinstall a mod",
	builder: {
		query: {
			type: "string",
			describe: "The name/id of the mod to reinstall",
			alias: "q"
		}
	},
	handler: (argv) => {
		if(!argv.query){
			console.log(chalk.red("Error: ") + "No mod specified.");
			return;
		}
		config.activeProfile.triggerModFunction(argv.query, "reinstall");
	}
})
.command({
	command: "profile <action> [name] [version] [loader]",
	describe: "Manage profiles",
	handler: (argv) => {
		if(!argv.action){
			console.log(chalk.red("Error: ") + "No action specified.");
			return;
		}
		switch(argv.action.toLowerCase()){
			case "create":
				if(!argv.name){
					console.log(chalk.red("Error: ") + "No name specified.");
					return;
				}
				config.createProfile(argv.name, argv.version, argv.loader);
				break;
			case "switch":
				if(!argv.name){
					console.log(chalk.red("Error: ") + "No name specified.");
					return;
				}
				config.switchProfile(argv.name);
				break;
			case "list":
				let profiles = config.loadProfiles();
				profiles = profiles.map((profile) => {
					return {
						name: profile.name,
						version: profile.version,
						loader: profile.loader,
						active: profile.name == config.activeProfile.name,
						"Amount of Mods": profile.mods.length
					}
				})
				console.table(profiles);
				break;
			case "delete":
				let deleteName = argv.name ?? config.activeProfile.name;
				config.activeProfile.triggerModFunction("all", "delete");
				config.deleteProfile(deleteName);
				console.log(chalk.green("Deleted profile: ") + deleteName);
				break;
			case "rename":
				if(!argv.name){
					console.log(chalk.red("Error: ") + "No name specified.");
					return;
				}
				config.activeProfile.rename(argv.name);
				break;
			default:
				console.log(chalk.red("Error: ") + "Invalid action specified.");
		}
	}
})
.command({
	command: "addmod <filename> <name> <ver> <loader>",
	describe: "Add a mod to fmm that isn't found on CurseForge or Modrinth",
	handler: (argv) => {
		createCustomMod(argv.filename, argv.name, argv.ver, argv.loader);
	}
})
.demandCommand()
.help()
.argv;
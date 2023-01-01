import chalk from "chalk";
import { config } from "./config.js";
import { loadMods } from "./utils.js";
import { curseforge } from "./moddbs/curseforge.js";
import { modrinth } from "./moddbs/modrinth.js";
import { inquirer } from "./index.js";
import { Mod } from "./mod.js";

export async function installModrinthMod(modID){
	let mods = config.activeProfile.loadMods();
	// check if the mod is already installed
	let existingMod = mods.find((mod) => mod.slug == modID.toLowerCase() || mod.id == modID)
	if(existingMod){
		console.log(chalk.red("Error: ") + `${existingMod.title} is already installed.`);
		return;
	}

	let mod = await modrinth.getMod(modID);
	if(!mod){
		console.log(chalk.red("Error: ") + "Mod not found.");
		return;
	}

	await addMod(mod);
}

export async function installCurseForgeMod(modID){
	let mods = config.activeProfile.loadMods();
	// check if the mod is already installed
	let existingMod = mods.find((mod) => mod.slug == modID.toLowerCase() || mod.id == modID)
	if(existingMod){
		console.log(chalk.red("Error: ") + `${existingMod.title} is already installed.`);
		return;
	}

	let mod = await curseforge.getMod(modID);
	if(!mod){
		console.log(chalk.red("Error: ") + "Mod not found.");
		return;
	}

	await addMod(mod);
}

async function addMod(mod){
	// install and update the mod
	let index = await mod.updateVersion();
	if(index == null) return;
	mod.swapVersion(index);

	config.activeProfile.addMod(mod);
}

export async function searchAllPlatforms(modID){
	// check if the mod is already installed
	let existingMod = config.getConfigValue("mods").find((mod) => mod.slug == modID.toLowerCase() || mod.id == modID)
	if(existingMod){
		console.log(chalk.red("Error: ") + `${existingMod.title} is already installed.`);
		return;	
	}
	let mrMod = await modrinth.getMod(modID, true);
	let cfMod = await curseforge.getMod(modID, true);
	let mod;

	if(!mrMod && !cfMod){
		console.log(chalk.red("Error: ") + "Mod not found.");
		return;
	}

	if(mrMod && cfMod){
		let res = await inquirer.prompt([
			{
				type: "list",
				name: "mod",
				message: "Which platform would you like to install this mod from?",
				choices: [
					{
						name: "Modrinth (recommended)",
						value: "modrinth"
					},
					{
						name: "CurseForge",
						value: "curseforge"
					}
				]
			}
		])

		if(res.mod == "modrinth"){
			mod = mrMod;
		}else{
			mod = cfMod;
		}
	}else{
		// if only one mod is found, install it
		if(mrMod){
			console.log(chalk.green("Installing mod from Modrinth"));
			mod = mrMod;
		}else{
			console.log(chalk.green("Installing mod from CurseForge"));
			mod = cfMod;
		}
	}

	await addMod(mod);
}

export function triggerModFunction(query, functionName, ...args){
	let mods = loadMods();

	// trigger on all mods if query is "all"
	if(query.toLowerCase() == "all"){
		for(let mod of mods){
			mod[functionName](...args);
		}
		return;
	}
	
	let mod = mods.find((mod) => mod.slug == query.toLowerCase() || mod.id == query);

	if(!mod){
		console.log(chalk.red("Error: ") + "Mod not found.");
		return;
	}

	mod[functionName]();
}

export function createCustomMod(fileName, name, version, loader){
	// check if the mod already exists
	let existingMod = config.getConfigValue("mods").find((mod) => mod.slug == name.toLowerCase() || mod.id == name)
	let mod;
	if(existingMod){
		mod = existingMod;
	}else{
		mod = new Mod("custom", name, name, name);
		mod.activeVersionIndex = 0;
	}
	mod.manuallyAdded = true;
	mod.versions.push({
		loader: loader,
		game_versions: [version],
		fileName: fileName,
		url: null
	})
	config.updateMod(mod);
	if(!existingMod) config.activeProfile.addMod(mod);
}
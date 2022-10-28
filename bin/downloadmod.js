import fetch from 'node-fetch';
import {CurseForgeClient, CurseForgeGameEnum, CurseForgeModLoaderType} from 'curseforge-api';
import fs from 'fs';
import { getConfigValue, addMod, setConfigValue } from './config.js';
import chalk from 'chalk';
import { rl } from './index.js';

let curseforgeKey = getConfigValue("curseforgeKey");
var client;
if(curseforgeKey){
	client = new CurseForgeClient(getConfigValue("curseforgeKey"), {fetch});
}

export async function downloadMod(slug, {modName, force, modsObject}){
	if(!client){
		console.log(chalk.red("You need to add a curseforge api key with 'fmm key' before you can download mods"));
		process.exit();
	}

	let mod;
	if(!isNaN(parseInt(slug))){
		if(modName) console.log(`Downloading ${modName} for Minecraft ${getConfigValue("fabricVersion")}`);
		else console.log("Downloading mod by id: " + slug);
		try{
			mod = await client.getMod(parseInt(slug));
		}catch(e){
			if(e.message.endsWith("(Forbidden)")){
				console.log(chalk.red("Invalid curseforge api key"));
				process.exit();
			}else{
				console.log(chalk.red("Mod not found"));
			}
			return;
		}
	}else{
		console.log("Downloading mod: " + slug);
		const modResults = await client.searchMods(CurseForgeGameEnum.Minecraft, {slug});
		mod = modResults.data[0];
		if(modResults.data.length == 0){
			console.log(chalk.red("No mods found for that query, try downloading a mod with it's curseforge id instead"));
			return;
		}
	}

	// get the mod's files
	const files = await mod.getFiles(mod.id, {
		modLoaderType: CurseForgeModLoaderType.Fabric,
		pageSize: 1
	})

	const fabricVersion = getConfigValue("fabricVersion")
	const file = files.data.find(f => f.gameVersions.includes(fabricVersion));

	if(!file){
		console.log(chalk.red(`No files matching game version "${fabricVersion}" found for that mod`));
		return;
	}

	// Check if the mod is already installed
	const currentMods = fs.readdirSync(getConfigValue("modDir"));
	if(currentMods.includes(file.fileName) && !force){
		const answer = await rl.question(chalk.yellow("Mod already downloaded, redownload? (y/N)"));
		if(answer.toLowerCase() != "y") return;
		return;
	}

	// Download the file
	const downloadUrl = file.downloadUrl;
	const modfile = await fetch(downloadUrl);
	let modFolder = getConfigValue("modDir") || `${process.env.APPDATA}\\.minecraft\\mods`;
	const fileStream = fs.createWriteStream(`${modFolder}\\${file.fileName}`);
	await new Promise((resolve, reject) => {
		modfile.body.pipe(fileStream);
		modfile.body.on("error", () => {
			console.log(chalk.red(`Error downloading mod: ${file.fileName}`));
			reject();
		});
		fileStream.on("finish", () => {
			console.log(chalk.green(`Downloaded mod ${file.fileName}`));
			addMod(mod.id, getConfigValue("fabricVersion"), file.fileName, mod.name, mod.slug, modsObject);
			resolve();
		});
	});
	return;
}

export async function uninstallMod(slug){
	slug = slug.toLowerCase();
	var mods = getConfigValue("mods");
	const mod = mods.find(m => m.modSlug == slug || m.id == slug);
	if(!mod){
		console.log(chalk.red("Mod not found"));
		return;
	}
	const modFolder = getConfigValue("modDir") || `${process.env.APPDATA}\\.minecraft\\mods`;
	const modPath = `${modFolder}\\${mod.fileName}`;
	if(!fs.existsSync(modPath)){
		console.log(chalk.yellow(`Couldn't find ${mod.fileName}`));
		return;
	}
	fs.unlinkSync(modPath);

	for(let alt of mod.altVersions ?? []){
		const altPath = `${modFolder}\\fmm-unused\\${alt.fileName}`;
		if(fs.existsSync(altPath)){
			fs.unlinkSync(altPath);
		}else{
			console.log(chalk.yellow(`Couldn't find ${alt.fileName}`));
		}
	}

	mods.splice(mods.indexOf(mod), 1);
	setConfigValue({mods});
	console.log(chalk.green("Uninstalled mod"));
}
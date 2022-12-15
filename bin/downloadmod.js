import fetch from 'node-fetch';
import {CurseForgeClient, CurseForgeGameEnum, CurseForgeModLoaderType} from 'curseforge-api';
import fs from 'fs';
import { getConfigValue, addMod, setConfigValue } from './config.js';
import chalk from 'chalk';
import { rl } from './index.js';
import { inq } from './index.js';
import inquirer from 'inquirer';
import unzipper from 'unzipper';

let curseforgeKey = getConfigValue("curseforgeKey");
var client;
if(curseforgeKey){
	client = new CurseForgeClient(getConfigValue("curseforgeKey"), {fetch});
}

export async function downloadMod(slug, {modName, force, modsObject}){
	
	const fabricVersion = getConfigValue("fabricVersion")
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
		if(modResults.data.length == 0){
			console.log(chalk.red("No mods found for that query, try downloading a mod with it's curseforge id instead"));
			return;
		}

		let type = "mod";

		// both a mod and modpack with that slug were found
		if(modResults.data.length > 1){
			let result = await inq.prompt([
				{
					type: "list",
					name: "type",
					message: "Both a mod and modpack with that slug was found, which would you like to download?",
					choices: [
						"Mod",
						"Modpack"
					]
				}

			])
			type = result.type.toLowerCase();
		}

		mod = modResults.data[0];

		if(mod.links.websiteUrl.includes("/modpacks/")) type = "modpack";

		if(type == "modpack"){
			// temporarily download the modpack, unzip it, and read manifest.json to get the mod ids
			const files = await mod.getFiles(mod.id, {
				modLoaderType: CurseForgeModLoaderType.Fabric,
				pageSize: 1
			})
			let correctFiles = files.data.filter(f => f.gameVersions.includes(fabricVersion))
			let file = correctFiles[0];
			// the modpack doesn't have a version for the current fabric version
			if(correctFiles.length == 0){
				const answer = await inquirer.prompt([
					{
						type: "confirm",
						name: "download",
						message: `The modpack doesn't have a version for the current fabric version (${fabricVersion}), would you like to download the latest version instead?`,
						default: false
					}
				])
				if(!answer.download) return;
				file = mod.latestFiles[0];
			}
			// download the modpack
			const downloadUrl = file.downloadUrl;
			const modfile = await fetch(downloadUrl);
			let tmpFolder = (getConfigValue("modDir") || `${process.env.APPDATA}\\.minecraft\\mods`) + "\\fmm_tmp";

			// make sure the tmp folder exists
			if(!fs.existsSync(tmpFolder)){
				fs.mkdirSync(tmpFolder);
			}
			
			const fileStream = fs.createWriteStream(`${tmpFolder}\\${mod.latestFiles[0].fileName}`);
			await new Promise((resolve, reject) => {
				modfile.body.pipe(fileStream);
				modfile.body.on("error", (err) => {
					reject(err);
				});
				fileStream.on("finish", function() {
					resolve();
				});
			});

			// make the folder where the unzipped modpack will be
			const modpackFolder = `${tmpFolder}\\${mod.latestFiles[0].fileName.replace(".zip", "")}`;
			if(!fs.existsSync(modpackFolder)){
				fs.mkdirSync(modpackFolder);
			}

			// unzip the modpack
			const zip = fs.createReadStream(`${
				tmpFolder
			}\\${mod.latestFiles[0].fileName}`).pipe(unzipper.Extract({ path: modpackFolder }));
			await new Promise((resolve, reject) => {
				zip.on("close", () => {
					resolve();
				});
				zip.on("error", (err) => {
					reject(err);
				});
			});

			// read the manifest.json file
			const manifest = JSON.parse(fs.readFileSync
				(`${modpackFolder}\\manifest.json`));
			

			// download the mods in the modpack
			console.log(chalk.green("Modpack successfully downloaded, installing " + manifest.files.length + " mods"));
			for(let i = 0; i < manifest.files.length; i++){
				console.log(chalk.green("Installing mod " + (i + 1) + " of " + manifest.files.length));
				const mod = manifest.files[i];
				await downloadMod(mod.projectID, fabricVersion, true);
			}

			// delete the tmp folder
			fs.rmdir(modpackFolder, { recursive: true }, (err) => {
				if(err) console.log(err);
			});

			return;
		}
	}

	// get the mod's files
	const files = await mod.getFiles(mod.id, {
		modLoaderType: CurseForgeModLoaderType.Fabric,
		pageSize: 1
	})

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
	if(slug.toLowerCase) slug = slug.toLowerCase();
	var mods = getConfigValue("mods");

	if(slug == "all"){
		const answer = await rl.question(chalk.yellow("Are you sure you want to uninstall all mods? (y/N)"));
		if(answer.toLowerCase() != "y") return;
		for(let mod of mods){
			await uninstallMod(mod.modID);	
		}
		return;
	}

	const mod = mods.find(m => m.modSlug == slug || m.modID == slug);
	if(!mod){
		console.log(chalk.red("Mod not found"));
		return;
	}
	const modFolder = getConfigValue("modDir") || `${process.env.APPDATA}\\.minecraft\\mods`;
	const modPath = `${modFolder}\\${mod.fileName}`;
	if(!fs.existsSync(modPath)){
		console.log(chalk.yellow(`Couldn't find ${mod.fileName}`));
	}else{
		fs.unlinkSync(modPath);
	}

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
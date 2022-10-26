import fetch from 'node-fetch';
import {CurseForgeClient, CurseForgeGameEnum, CurseForgeModLoaderType} from 'curseforge-api';
import fs from 'fs';
import { getConfigValue } from './config.js';

const client = new CurseForgeClient(getConfigValue("curseforgeKey"), {fetch});

export async function downloadMod(slug){
	const modResults = await client.searchMods(CurseForgeGameEnum.Minecraft, {slug});
	const tweakeroo = modResults.data[0];
	const files = await tweakeroo.getFiles(297344, {
		gameVersion: "1.19.2",
		modLoaderType: CurseForgeModLoaderType.Fabric,
		pageSize: 1
	})
	const downloadUrl = files.data[0].downloadUrl;
	const file = await fetch(downloadUrl);
	const fileStream = fs.createWriteStream(`${getConfigValue("modDir")}\\${slug}.jar`);
	await new Promise((resolve, reject) => {
		file.body.pipe(fileStream);
		file.body.on("error", () => {
			console.log(`Error downloading mod: ${files.data[0].displayName}`);
			reject();
		});
		fileStream.on("finish", () => {
			console.log(`Downloaded mod ${files.data[0].displayName}`);
			resolve();
		});
	});
}
# Fabric Mod Manager

Fabric Mod Manager is a tool to manage Fabric mods. It is designed to be used with the [Fabric Loader](https://fabricmc.net/use/).

### Getting the script running

1. Download this repository to your computer, either with git or by downloading the zip file.

2. Make sure you have [Node.js](https://nodejs.org/en/) installed at version 19.0.0 or above.

3. Open a terminal in the directory you downloaded this repository to and run `npm i -g .` to install this tool globally.

### Getting Started

For quick setup, run `fmm setup` to get a setup menu. Follow the steps given by the tool to get going. This will include getting a curseforge API key, which you can get [here](https://console.curseforge.com/#/api-keys).

### Usage

Once you have set up fmm, you can safely use it to download and manage mods. To install a mod, type `fmm download -q [modID or slug]`. You can find the mod's ID on the curseforge page, and it's slug will be the end of the link to it.

For example, if I wanted to download tweakeroo, I would type `fmm download -q tweakeroo`. The loader will always attempt to get a version of the mod that matches your selected fabric version, and will return an error if none exist.

#### Versioning

The main allure of fmm is that it can easily move between versions. To do this, use the `fmm version --ver [new fabric version]` command.

This will store away the mods you are currenly using for re-use later, and attempt to get the mods you had before for the new version. IF a mod doesn't have a release for that version, it will be skipped.

### Commands

#### `fmm setup`
Displays a setup menu to get you started with fmm.

#### `fmm download -q [modID or slug]`
Downloads a mod from curseforge. You can find the mod's ID on the curseforge page, and it's slug will be the end of the link to it.

#### `fmm version`
When left blank, will show the current version of fabric you are using. When given the `--ver [new fabric version]` flag, it will attempt to move to that version.

#### `fmm moddir`
When left blank, will show the current mod directory. When given the `--dir [new mod directory]` flag, it will attempt to move to that directory.

#### `fmm key --key [your api key]`
Will set your curseforge API key to the given key. You can get a key [here](https://console.curseforge.com/#/api-keys).

#### `fmm list`
Lists all the mods you have installed.
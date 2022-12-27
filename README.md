# Fabric Mod Manager

Fabric Mod manager is a command line tool to install, update and otherwise manage mods for the Fabric mod loader.

## Installation

To install FMM, you can download or clone this reposiory. Then, open a terminal inside the directory and run `npm i -g .` to install it globally.

## Setup

To get started using FMM, you need to set the directory where mods will be downloaded to. This will probably look like

`fmm moddir -p "C:\Users\<name>\AppData\Roaming\.minecraft\mods"`

You can then start installing mods with `fmm install`

## Commands

### `fmm install [platform] -q <modID/slug>`

Installs a mod from either curseforge or modrinth. You can specify which platform to install it from by setting platform, but otherwise it will automatically search both. An example of this command would look like this:
```bash
fmm install -q no-chat-reports
fmm install curseforge -q no-chat-reports
fmm install modrinth -q qQyHxfxd
```

### `fmm uninstall -q <modID/slug>`

Uninstalls a mod, and deletes it's files. An example of this command would look like this:

```bash
fmm uninstall -q no-chat-reports
```

### `fmm key <platform> <key>`

Sets an API key for a platform. Right now, this is only neccesary for Curseforge. You can obtain a curseforge api key [here](https://console.curseforge.com/#/api-keys). An example of this command would look like this:

```bash
fmm key curseforge [your_epic_key_here]
```

### `fmm moddir -p <path>`

Sets the directory where mods will be downloaded to. This is neccesary to begin downloading mods. An example of this command would look like this:

```bash
fmm moddir -p "C:\Users\<name>\AppData\Roaming\.minecraft\mods"
```

### `fmm list`

Returns an ASCII table of all installed mods.

### `fmm version -v <version>`

Updates the version of Fabric to use for mod installation. Automatically updates all mods to the set fabric version. An example of this command would look like this:

```bash
fmm version -v 1.13.2
```

### `fmm disable -q <modID/slug>`

Disables a mod, but stores it's files for use later. An example of this command would look like this:

```bash
fmm disable -q no-chat-reports
```

### `fmm enable -q <modID/slug>`
Enables a mod, and restores it's files. An example of this command would look like this:

```bash
fmm enable -q no-chat-reports
```

### `fmm reinstall -q <modID/slug>`

Reinstalls a mod on the current version.
import { CitySettings } from "../settings.js";
import { SystemModuleI } from "../systemModule/baseSystemModule.js";
import { CoMSystem } from "../systemModule/com-system.js";

export abstract class SystemModule {

	static systems= new Map<keyof SYSTEM_NAMES, SystemModuleI>();

	static systemChoices() : SYSTEM_NAMES {
		const obj : Partial<SYSTEM_NAMES> = {};
		for (const v of this.systems.values()) {
			obj[v.name]= v.localizationString;
		}
		return obj as SYSTEM_NAMES;
	}

	static get active(): SystemModuleI {
		const system = CitySettings.getBaseSystem();
		const sys = this.systems.get(system);
		if (sys) return sys;
		ui.notifications.error("No system module, defaulting to CoM");
		return new CoMSystem();
	}

	static registerRulesSystem<T extends SystemModuleI>(system: T) {
		// game.rulesSystems.set(system.name, system);
		this.systems.set(system.name, system);
		console.log(`Rules System Registered: ${system.name}`);
	}

	static async init() {
		window.SystemModule = this;
		try {
			Hooks.callAll("registerRulesSystemPhase", this);
		} catch (a) {
			const err =a as Error;
			console.warn(`error ${err.name}: ${err.stack}`);
		}
	}

	static async setActive(systemName: keyof SYSTEM_NAMES) : Promise<boolean> {
		try {
			await CitySettings.set("baseSystem", systemName);
			await this.active.onChangeTo();
			await this.active.activate();
		} catch (e) {
			const err = e as Error;
			console.log(`Error ${err.message}\n : ${err.stack} `);
			return false;
		}
		return true;
	}

	static setActiveStyle( system: SystemModuleI) {
		const body = $(document).find("body");
		for (const {name} of this.systems.values()) {
			const style =  `style-${name}`;
			body.removeClass(style);
		}
		const newStyle =  `style-${system.name}`;
		body.addClass(newStyle);
	}

}



declare global {
	interface Window {
		SystemModule: typeof SystemModule
	}

}


import { readdirSync, readFileSync } from "fs"
import { capitalize, stripBOM } from "tutils/misc"
import { getDir, getName, joinPath, relativePath } from "tutils/path"
import { DevServerOptions } from "./devServer"

/**
 * 读取自动生成的配置
 * @param path 配置的文件路径
 */
export function readConfigs(path = "package.json") {
	let pkg: any
	try {
		pkg = JSON.parse(stripBOM(readFileSync(path, "utf8")))
	} catch (e) {
		pkg = {
			error: e
		}
	}
	const configs: DevServerOptions = pkg.tdk ?? {}
	const doc = configs.doc ??= {}
	const git = (doc as any).git !== false
	doc.packageName ??= pkg.private ? pkg.name : undefined
	doc.displayName ??= capitalize(getName(pkg.name || process.cwd()))
	doc.version ??= pkg.version
	if (doc.repository === undefined) {
		// FIXME: 支持 repository 内置别名?
		// https://docs.npmjs.com/files/package.json#repository
		if (typeof pkg.repository === "string" && /^(?:git@|https?:)/.test(pkg.repository)) {
			doc.repository = pkg.repository
		} else if (pkg.repository) {
			doc.repository = pkg.repository.url
			doc.repositoryPath = pkg.repository.directory
		} else if (git) {
			doc.repository = exec("git", ["config", "remote.origin.url"])
		}
	}
	doc.repository = doc.repository?.replace(/\/$|\.git$/i, "").replace(/^git@(.*?)[:\/](.*)$/i, "https://$1/$2")
	if (doc.branch === undefined && git) {
		for (let prevDir = "", dir = process.cwd(); prevDir.length !== dir.length; prevDir = dir, dir = getDir(dir)) {
			const path = joinPath(dir, ".git/HEAD")
			try {
				const content = readFileSync(path, "utf-8")
				doc.branch = content.trim().replace(/^.*[\/\s]/, "")
				doc.repositoryPath ??= relativePath(dir, process.cwd()).replace(/\\/g, "/")
				break
			} catch { }
		}
	}
	configs.baseDir ??= "."
	const dirs = readdirSync(configs.baseDir)
	configs.srcDir ??= ["components", "packages", "src", "lib"].find(dir => dirs.includes(dir)) ?? "components"
	doc.navbar ??= [
		{ label: "上手", href: "guide/" },
		{ label: "教程", href: "tutorial/" },
		{ label: "文档", href: "docs/" },
		{ label: getName(configs.srcDir) === "components" ? "组件" : "API", href: relativePath(configs.baseDir, configs.srcDir) + "/" },
		{ label: "演示", href: "demo/" },
		{ label: "示例", href: "examples/" },
		{ label: "资源", href: "resources/" },
		{ label: "工具", href: "tools/" },
	].filter(t => dirs.includes(t.href.slice(0, -1)))
	doc.introDescription = pkg.description
	doc.introButtons ??= [{
		label: "快速开始",
		href: doc.navbar?.[0]?.href
	}]
	doc.features ??= [{
		label: "简单易用",
		description: "遵循统一的设计标准和开发规范，开发更加简单高效。",
		icon: `<svg class="doc-icon" viewBox="0 0 1024 1024"><path d="M13.5 14.2h-11c-0.3 0-0.5-0.2-0.5-0.5V3.2c0-0.3 0.2-0.5 0.5-0.5h11c0.3 0 0.5 0.2 0.5 0.5v10.5c-0.1 0.3-0.3 0.5-0.5 0.5zM3 13.3h10V3.7H3v9.6zM10.5 11.7c-0.1 0-0.2 0-0.3-0.1-0.2-0.2-0.2-0.5 0-0.6l1.1-1.1-1.1-1.1c-0.2-0.2-0.2-0.5 0-0.6s0.5-0.2 0.6 0l1.4 1.4c0.2 0.2 0.2 0.5 0 0.6l-1.4 1.4c-0.1 0-0.2 0.1-0.3 0.1z m-4.8 0c-0.1 0-0.2 0-0.3-0.1L4 10.1c-0.2-0.1-0.2-0.4 0-0.6l1.4-1.4c0.2-0.1 0.5-0.1 0.6 0 0.2 0.2 0.2 0.5 0 0.6L5 9.8l1 1.1c0.2 0.2 0.2 0.5 0 0.6-0.1 0.1-0.2 0.2-0.3 0.2z m1.8 0.2h-0.2c-0.2-0.1-0.3-0.4-0.3-0.6L8.5 8c0.1-0.2 0.4-0.3 0.6-0.3s0.3 0.4 0.3 0.6L8 11.6c-0.1 0.2-0.3 0.3-0.5 0.3zM13.5 6.9h-11c-0.3 0-0.5-0.2-0.5-0.5s0.2-0.5 0.5-0.5h11c0.3 0 0.5 0.2 0.5 0.5s-0.3 0.5-0.5 0.5zM11.4 5.5c-0.4 0-0.7-0.3-0.7-0.7s0.3-0.7 0.7-0.7 0.7 0.3 0.7 0.7-0.3 0.7-0.7 0.7z m0-0.9c-0.1 0-0.2 0.1-0.2 0.2s0.1 0.2 0.2 0.2 0.2-0.1 0.2-0.2 0-0.2-0.2-0.2z m-1.8 0.9c-0.4 0-0.7-0.3-0.7-0.7s0.3-0.7 0.7-0.7 0.7 0.3 0.7 0.7-0.3 0.7-0.7 0.7z m0-0.9c-0.1 0-0.2 0.1-0.2 0.2s0.1 0.2 0.2 0.2 0.2-0.1 0.2-0.2-0.1-0.2-0.2-0.2zM266.4 519.3c-75.7-19.5-134-80-150.7-156.5-12-53.8-1.9-110.1 28-156.4 29.7-46.5 76.8-79.2 130.8-90.8C383.2 91.8 491.1 157.1 520 264.1c3.8 12.4 17 19.4 29.4 15.5 11.8-3.6 18.7-15.7 16-27.7-35.5-131.2-167.7-211.1-300.9-182-66.1 14.3-123.8 54.3-160.2 111.3-36.7 56.7-49 125.8-34.4 191.7 20.4 93.6 91.8 167.8 184.6 191.7 12.5 3.3 25.4-4.2 28.7-16.7 3.3-12.5-4.2-25.3-16.8-28.6m610.6 276l-147.4 91c-10.7 6.1-20.8 9.2-30 9.2-9.8 0-24.1-2.2-36.4-13-34.7-27-70-48.9-104.9-65L349 718c-11.4-5.4-16.6-18.7-11.8-30.4 3.6-8.4 12-14 21-14 1.8 0 3.3 0.3 4.9 0.7 1.3 0.3 2.5 0.6 3.9 0.7l111.4 47.2c3.8 1.9 8.7 1.9 11.9 1.9 8.5 0 16.7-3.5 23.3-10.1 8.5-9.7 9.8-23.8 3.2-34.9L296 316c-3.3-5-4.4-11.1-3-16.8 1.4-6 5-11.1 10.2-14.5 3.3-2.3 7.4-3.5 11.4-3.4 8.5 0 15 3.6 18.5 10.4l161.6 264.9c4.7 7.7 13.2 12.3 22.3 12.1 6.1 0 11.4-2.3 13.7-3.5l7.2-4.3c10.2-6.8 13.9-20.4 8.5-32.9l-67.5-112.1c-3.2-5.1-5.3-10.9-6-16.9-0.7-8.1 2.5-14.2 10.2-18.8 2.9-2.1 6.4-3.3 10-3.4 12.6 0 22.6 15.8 22.7 16l29.5 47.6 36.6 60.3c4.9 8.4 14 13.6 23.7 13.5 5.1 0 10.2-1.7 14.7-4.7l5.9-2.9c5.8-3.3 10-8.9 11.5-15.4 1.6-6.5 0.5-13.3-2.8-19.1l-36.5-60.2c-13-22.6 0.9-31.4 5-34.1 5.3-2.6 8.7-3.7 12-3.7 10.2 0 18.8 12.4 19.9 14.6l52 85.5c4.9 8.2 14.8 13.5 25.1 13.5 5.2 0 10.3-1.7 15.1-4.9 13.8-8.6 18.2-26.7 10-41.4l-12.8-21.2c0-0.1-5-7.7-6.3-17.6-1.1-9.3 2.1-15.9 10.1-20.4l3.4-1.8c3.4-1.8 6.4-3.4 8.6-3.4 0.4 0.1 1 0.4 2.8 1.3 7.9 2.3 14.1 10.4 18.4 16.1l46.6 76.1c3.8 5.1 6.6 12 9.1 18.3l81.4 247.5c5.1 23.9-3.5 47.3-21.8 59m77.2-74.5l-81.5-248.2c-3.9-10.9-8.8-21.5-14.4-31.6L813 366.2l-0.8-1.3c-14.7-22.9-32.7-37.1-53.7-42.3-6.2-1.5-10.8-1.5-16.6-1.5-14.5 0-27.8 4.1-43.4 13.4-6.9 4.4-13.2 9.7-18.6 15.9-6.3-7.5-13.4-14.2-21.2-20.1-13.6-9-27.3-13.4-42-13.4-15.5 0.1-30.6 4.7-43.4 13.4-6.4 4.3-13 9.2-18.8 16.1-4.1-4.2-9.5-8.4-15.4-11.9-14.6-9.7-29.5-14.8-43.3-14.8-14.7 0-28.4 4.4-42 13.4-6.1 3.8-11.7 8.5-16.7 13.7l-49.8-82.4c-15.2-24-41.6-38.5-70-38.6-14.6 0-29.5 4.2-41.8 11.9-38.6 23.7-50.6 74.3-26.9 112.9L332.9 489l10 18.4 78.3 129.4-27.5-11.4c-9.9-4.1-20.6-6.2-31.3-6-33.2 0.1-63 20-76 50.5-17.7 41.3 0.4 89.3 40.2 107L536 876.4c28.7 13.1 57.4 31.1 93.3 58.3 12.4 9.6 28 17.2 45.8 22 8.5 1.4 17.2 2.9 27.3 2.9 22.7 0 44.6-6.3 61.5-17.5l148-91.4c39.4-31.7 56.3-83.8 42.3-129.9M302.8 187.2c64.3-7.3 124.1 34.3 139.3 96.8 3.1 12.6 15.8 20.3 28.4 17.3 12.6-3 20.3-15.6 17.3-28.2v-0.1C467 187.5 385.2 130.6 297.5 140.6c-96 10.9-165.2 97.8-154.3 193.6 7.4 65.4 51 121.1 112.8 143.9 12.1 4.6 25.6-1.5 30.2-13.6v-0.1c4.6-12.1-1.6-25.6-13.7-30.1h-0.1c-45.2-16.7-77.2-57.5-82.6-105.4-8-70.2 42.7-133.7 113-141.7"></path></svg>`
	}, {
		label: "跨平台",
		description: "只需写一遍代码，即可在电脑、手机、平板中运行。",
		icon: `<svg class="doc-icon" viewBox="0 0 1024 1024"><path d="M892.928 421.888h-201.216c-27.136 0-49.152 22.016-49.152 49.152V838.144c0 3.584 0.512 6.656 1.536 10.24 5.632 20.992 24.576 36.352 47.104 36.352h201.216c22.528 0 41.472-15.36 47.104-36.352 1.024-3.072 1.536-6.656 1.536-10.24V471.04c1.024-27.136-20.992-49.152-48.128-49.152z m-201.216 32.768h201.216c9.216 0 16.384 7.168 16.384 16.384v312.32h-233.984V471.04c0-9.216 7.168-16.384 16.384-16.384z m75.264 367.616c0-13.824 11.264-24.576 24.576-24.576s24.576 11.264 24.576 24.576c0 13.824-11.264 24.576-24.576 24.576s-24.576-10.752-24.576-24.576zM548.864 843.776s-61.952 0-61.952-61.952c0-11.264 1.536-21.504 3.072-30.72h184.32v-123.904h-527.36V256.512h556.544v197.632h61.952V256.512c0-34.304-27.648-61.952-61.952-61.952H146.944c-34.304 0-61.952 27.648-61.952 61.952v432.64c0 34.304 27.648 61.952 61.952 61.952h213.504c1.536 9.216 3.072 19.456 3.072 30.72 0 61.952-61.952 61.952-61.952 61.952-16.896 0-30.72 7.168-30.72 15.36 0 8.704 13.824 15.36 30.72 15.36h247.296c16.896 0 30.72-7.168 30.72-15.36s-13.824-15.36-30.72-15.36z"></path></svg>`
	}, {
		label: "扩展性强",
		description: "支持按需导入，轻量、灵活；接口丰富，可以按需求任意扩展。",
		icon: `<svg class="doc-icon" viewBox="0 0 1024 1024"><path d="M974.72 84.48l-49.28-49.28c-1.92-1.92-3.84-2.56-6.4-2.56s-5.12 1.28-6.4 2.56l-88.96 88.96c-92.8-62.72-216.96-50.56-295.68 28.16L408.32 270.72c-3.84 3.84-3.84 9.6 0 13.44L725.76 601.6c1.92 1.92 3.84 2.56 6.4 2.56s5.12-1.28 6.4-2.56L857.6 481.92c78.72-79.36 90.88-202.88 28.16-295.68l88.96-88.96c3.2-3.2 3.2-9.6 0-12.8zM812.8 434.56l-75.52 75.52-238.72-238.08 75.52-75.52c65.92-65.92 172.8-65.92 238.72 0 65.28 65.92 65.28 172.8 0 238.08zM622.08 590.72l-42.88-42.24c-3.84-3.84-9.6-3.84-13.44 0L488.32 625.92 383.36 520.96 460.8 442.88c3.84-3.84 3.84-9.6 0-13.44l-42.88-42.24c-3.84-3.84-9.6-3.84-13.44 0l-76.8 78.08-49.92-49.92c-1.92-1.92-3.84-2.56-6.4-2.56s-5.12 1.28-6.4 2.56L145.28 533.76c-78.72 79.36-90.88 202.88-28.16 295.68L28.16 917.76c-3.84 3.84-3.84 9.6 0 13.44l49.28 49.28c1.92 1.92 3.84 2.56 6.4 2.56s5.12-1.28 6.4-2.56L179.2 891.52c92.8 62.72 216.96 50.56 295.68-28.16l119.04-119.04c3.84-3.84 3.84-9.6 0-13.44l-49.92-50.56 78.08-77.44c3.84-2.56 3.84-8.32 0-12.16z m-191.36 231.04c-43.52 43.52-106.88 60.16-165.76 44.16-59.52-16-105.6-62.08-121.6-121.6s1.28-122.24 44.16-165.76l77.44-77.44 242.56 242.56-76.8 78.08z"></path><path d="M385.28 518.4L460.8 442.88c3.84-3.84 3.84-9.6 0-13.44l-42.88-42.24c-3.84-3.84-9.6-3.84-13.44 0L329.6 462.72l55.68 55.68zM622.08 590.72l-42.88-42.24c-3.84-3.84-9.6-3.84-13.44 0L490.88 623.36l55.68 55.68 76.16-75.52c3.2-3.2 3.2-8.96-0.64-12.8z"></path></svg>`
	}]
	doc.links ??= [
		{
			label: getName(configs.srcDir) === "components" ? "组件列表" : "API 手册",
			href: relativePath(configs.baseDir, configs.srcDir),
			icon: `<svg class="doc-icon" viewBox="0 0 1024 1024"><path d="M352 448h-192C107.072 448 64 404.928 64 352v-192C64 107.072 107.072 64 160 64h192C404.928 64 448 107.072 448 160v192C448 404.928 404.928 448 352 448z m-192-320a32 32 0 0 0-32 32v192a32 32 0 0 0 32 32h192a32 32 0 0 0 32-32v-192a32 32 0 0 0-32-32h-192zM864 448h-192C619.072 448 576 404.928 576 352v-192c0-52.928 43.072-96 96-96h192c52.928 0 96 43.072 96 96v192c0 52.928-43.072 96-96 96z m-192-320a32 32 0 0 0-32 32v192a32 32 0 0 0 32 32h192a32 32 0 0 0 32-32v-192a32 32 0 0 0-32-32h-192zM352 960h-192c-52.928 0-96-43.072-96-96v-192C64 619.072 107.072 576 160 576h192c52.928 0 96 43.072 96 96v192c0 52.928-43.072 96-96 96z m-192-320a32 32 0 0 0-32 32v192a32 32 0 0 0 32 32h192a32 32 0 0 0 32-32v-192a32 32 0 0 0-32-32h-192zM864 960h-192c-52.928 0-96-43.072-96-96v-192c0-52.928 43.072-96 96-96h192c52.928 0 96 43.072 96 96v192c0 52.928-43.072 96-96 96z m-192-320c-17.6 0-32 14.4-32 32v192c0 17.6 14.4 32 32 32h192c17.6 0 32-14.4 32-32v-192c0-17.6-14.4-32-32-32h-192z"></path></svg>`,
			noCheck: true
		},
		{
			label: "案例演示",
			href: dirs.includes("examples") ? "examples" : "demo",
			icon: `<svg class="doc-icon" viewBox="0 0 1024 1024"><path d="M915.2 742.4H115.2c-51.2 0-96-44.8-96-96V115.2C19.2 64 64 19.2 115.2 19.2h800c51.2 0 96 44.8 96 96v531.2c0 51.2-44.8 96-96 96zM115.2 83.2c-19.2 0-32 12.8-32 32v531.2c0 19.2 12.8 32 32 32h800c19.2 0 32-12.8 32-32V115.2c0-19.2-12.8-32-32-32H115.2z"></path><path d="M512 979.2c-19.2 0-32-12.8-32-32v-230.4c0-19.2 12.8-32 32-32s32 12.8 32 32v230.4c0 19.2-12.8 32-32 32z"></path><path d="M876.8 1004.8H147.2c-19.2 0-32-12.8-32-32s12.8-32 32-32h736c19.2 0 32 12.8 32 32s-19.2 32-38.4 32zM403.2 576c-6.4 0-12.8 0-19.2-6.4-12.8 0-12.8-12.8-12.8-25.6V211.2c0-12.8 0-19.2 12.8-25.6 12.8-6.4 19.2-6.4 32 0L704 352c12.8 6.4 19.2 19.2 19.2 25.6s-6.4 25.6-19.2 25.6L416 569.6c-6.4 6.4-12.8 6.4-12.8 6.4z m32-307.2v224l192-108.8-192-115.2z"></path></svg>`
		},
		{
			label: "文档手册",
			href: dirs.includes("docs") ? "docs" : dirs.includes("tutorial") ? "tutorial" : "guide",
			icon: `<svg class="doc-icon" viewBox="0 0 1024 1024"><path d="M992 303.68V801.408c0 49.152-37.376 89.024-83.456 89.024h-83.52v-44.48h83.52c23.04 0 41.728-19.968 41.728-44.48v-467.52H783.296c-46.144 0-83.456-39.872-83.456-89.024V44.608H324.16c-23.04 0-41.728 19.968-41.728 44.48h-41.728c0-49.152 37.376-89.024 83.52-89.024H728.32L985.92 296M741.568 81.536v163.328c0 24.576 18.688 44.48 41.792 44.48h140.992L741.568 81.536z m41.728 355.712V934.848c0 49.152-37.376 89.088-83.456 89.088H115.456c-46.08 0-83.456-39.872-83.456-89.088v-712.32c0-49.152 37.376-89.024 83.456-89.024h404.096l257.664 295.872M532.864 215.04v163.392c0 24.576 18.688 44.48 41.728 44.48h140.992L532.864 215.04z m-459.136 7.552v712.32c0 24.64 18.688 44.544 41.728 44.544H699.84c23.04 0 41.728-19.968 41.728-44.544V467.456H574.656c-46.08 0-83.456-39.872-83.456-89.024v-200.32H115.52c-23.104 0-41.792 19.904-41.792 44.48z m104.384 267.136h208.704v44.48H178.112v-44.48z m0-133.568h208.704v44.48H178.112v-44.48z m459.136 311.68H178.112v-44.48h459.136v44.48z m0 133.568H178.112v-44.544h459.136v44.544z" stroke="currentColor" stroke-width="20" stroke-linecap="round" /></svg>`
		},
		{
			label: "资源下载",
			href: dirs.includes("download") ? "download" : "resources",
			icon: `<svg class="doc-icon" viewBox="0 0 1058 1024"><path d="M990.967742 624.970323a33.032258 33.032258 0 0 1 32.503742 27.086451l0.528516 5.945807v199.911225c0 70.35871-55.560258 127.636645-125.720774 132.657549l-10.107871 0.396387H168.860903c-71.217548 0-130.213161-54.305032-135.432258-123.078194l-0.396387-9.909677V657.870452a33.032258 33.032258 0 0 1 65.536-5.945807l0.528516 5.945807v199.97729c0 34.155355 27.218581 62.893419 62.100645 66.593032l7.663484 0.396387h719.310452c36.13729 0 65.602065-26.293677 69.367742-59.722322l0.396387-7.267097V658.002581a33.032258 33.032258 0 0 1 33.032258-33.032258zM528.516129 0a33.032258 33.032258 0 0 1 32.503742 27.086452L561.548387 33.032258v496.673032l200.836129-195.352774a33.032258 33.032258 0 0 1 49.944774 42.809807l-3.831742 4.492387-256.990967 249.988129a33.032258 33.032258 0 0 1-40.893936 4.096l-5.153032-4.096-256.924903-249.988129a33.032258 33.032258 0 0 1 41.488516-51.067871l4.624516 3.765677L495.483871 529.771355V33.032258A33.032258 33.032258 0 0 1 528.516129 0z"></path></svg>`
		},
		{
			label: "帮助与支持",
			href: `${doc.repository}/issues`,
			icon: `<svg class="doc-icon" viewBox="0 0 1060 1024"><path d="M513.28 787.821714a27.428571 27.428571 0 0 1 21.101714-9.910857h174.409143c17.225143 0 31.780571-15.36 31.780572-34.925714V375.698286c0-19.602286-14.555429-34.925714-31.780572-34.925715H205.494857c-17.225143 0-31.780571 15.36-31.780571 34.925715v367.286857c0 19.602286 14.555429 34.925714 31.780571 34.925714h174.409143c8.155429 0 15.872 3.657143 21.101714 9.910857l56.137143 67.693715 56.137143-67.657143z m-307.785143 44.946286c-48.164571 0-86.637714-40.521143-86.637714-89.782857V375.698286c0-49.261714 38.473143-89.782857 86.637714-89.782857h503.296c48.164571 0 86.637714 40.521143 86.637714 89.782857v367.286857c0 49.261714-38.473143 89.782857-86.637714 89.782857h-161.499428l-69.046858 83.236571a27.428571 27.428571 0 0 1-42.203428 0l-69.046857-83.236571H205.531429z"></path><path d="M387.328 178.468571a27.428571 27.428571 0 0 1-54.857143 0c0-44.105143 38.875429-78.409143 85.211429-78.409142h491.373714c46.372571 0 85.211429 34.304 85.211429 78.409142v300.324572c0 44.105143-38.838857 78.409143-85.211429 78.409143a27.428571 27.428571 0 1 1 0-54.857143c17.481143 0 30.354286-11.337143 30.354286-23.552V178.468571c0-12.178286-12.873143-23.552-30.354286-23.552H417.718857c-17.517714 0-30.354286 11.337143-30.354286 23.552zM398.226286 512.987429a23.771429 23.771429 0 1 1-46.665143-9.216c10.934857-55.222857 48.054857-85.138286 105.142857-85.138286 70.838857 0 106.459429 39.643429 106.459429 89.746286 0 29.549714-10.971429 49.371429-34.816 74.130285-2.340571 2.450286-11.044571 11.300571-12.982858 13.275429-24.868571 25.709714-34.596571 45.056-34.450285 80.054857a23.771429 23.771429 0 0 1-47.542857 0.219429c-0.219429-49.152 15.104-79.433143 47.798857-113.298286l12.946285-13.202286c16.091429-16.749714 21.504-26.514286 21.504-41.179428 0-24.868571-15.542857-42.203429-58.88-42.203429-34.633143 0-52.041143 14.043429-58.514285 46.811429z"></path></svg>`,
			noCheck: !!doc.repository
		}
	].filter(t => t.noCheck || dirs.includes(t.href))
	doc.support ??= doc.repository ? {
		label: "参与贡献",
		href: doc.repository
	} : undefined
	doc.copyright ??= `© 2011-2021 The Teal Team.`
	doc.footer ??= [{
		label: `Generated by TDK`,
		href: "https://github.com/Teal/TDK/"
	}]
	if (git) {
		doc.readCommits = files => {
			const commits = exec("git", ["log", "--all", "--pretty=format:%an%x00%ae%x00%cd", "--", ...files])
			if (!commits) {
				return []
			}
			return commits.split("\n").map(commit => {
				const parts = commit.split("\0")
				return {
					authorName: parts[0],
					authorEmail: parts[1],
					date: new Date(parts[2]).toLocaleDateString() || parts[2]
				}
			})
		}
	}
	return configs
}

/** 执行一个命令并返回标准流输出内容 */
function exec(command: string, args: string[]) {
	const { execFileSync } = require("child_process") as typeof import("child_process")
	try {
		return execFileSync(command, args, { encoding: "utf-8", stdio: "pipe" }).trim()
	} catch {
		return ""
	}
}

/** 读取当前程序的版本号 */
export function version() {
	return require("../package.json").version
}
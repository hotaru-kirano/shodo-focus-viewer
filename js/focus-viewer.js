(function () {
	"use strict";

	var defaultKanji = "線";
	var groupPalette = ["#d94848", "#f08c00", "#2b8a3e", "#1f6feb", "#7e57c2", "#0f766e"];
	var hexKanji = /^\s*([0-9a-fA-F]{4,5})\s*$/;

	var modeNames = {
		normal: "normal",
		radicals: "radicals",
		groups: "groups"
	};

	var defaultSpeedLevel = 6;
	var speedTableMs = [900, 700, 550, 420, 320, 240, 170, 120, 80, 45];

	var state = {
		kanji: defaultKanji,
		file: null,
		mode: modeNames.normal,
		showStrokeOrders: true,
		sourceSVG: null,
		requestID: 0
	};

	var animationState = {
		perStrokeMs: 80,
		loopPauseMs: 180,
		timer: null,
		currentAnimator: null
	};

	function kanjiInput() {
		return document.getElementById("focus-kanji");
	}

	function kanjiImage() {
		return document.getElementById("focus-kanji-image");
	}

	function messageBox() {
		return document.getElementById("focus-user-message");
	}

	function clearMessage() {
		var box = messageBox();
		box.textContent = "";
		box.style.display = "none";
	}

	function setMessage(message) {
		var box = messageBox();
		box.textContent = message;
		box.style.display = "block";
	}

	function updateModeButtons() {
		var buttons = document.querySelectorAll(".focus-mode-button");
		for (var i = 0; i < buttons.length; i++) {
			var button = buttons[i];
			button.classList.toggle("is-active", button.dataset.mode === state.mode);
		}
	}

	function updateStrokeButton() {
		var button = document.getElementById("focus-stroke-toggle");
		if (state.showStrokeOrders) {
			button.textContent = "Stroke #: On";
		} else {
			button.textContent = "Stroke #: Off";
		}
		button.classList.toggle("is-active", state.showStrokeOrders);
	}

	function speedSlider() {
		return document.getElementById("focus-speed");
	}

	function speedValue() {
		return document.getElementById("focus-speed-value");
	}

	function speedLevelToMs(level) {
		var index = Math.max(1, Math.min(10, Number(level) || defaultSpeedLevel)) - 1;
		return speedTableMs[index];
	}

	function updateSpeedLabel(level) {
		var value = speedValue();
		if (value) {
			value.textContent = String(level) + " (" + speedLevelToMs(level) + "ms)";
		}
	}

	function applySpeedLevel(level) {
		var safeLevel = Math.max(1, Math.min(10, Number(level) || defaultSpeedLevel));
		animationState.perStrokeMs = speedLevelToMs(safeLevel);
		updateSpeedLabel(safeLevel);
	}

	function stopAnimationLoop() {
		if (animationState.timer) {
			clearTimeout(animationState.timer);
			animationState.timer = null;
		}
		if (animationState.currentAnimator && typeof animationState.currentAnimator.stop === "function") {
			animationState.currentAnimator.stop();
		}
		animationState.currentAnimator = null;
	}

	function startAnimationLoop() {
		stopAnimationLoop();
		if (typeof KVGAnimator === "undefined") {
			return;
		}
		var playOnce = function () {
			var currentSvg = document.getElementById("kanji-svg");
			if (!currentSvg || !currentSvg.querySelectorAll("path").length) {
				return;
			}
			var animator = new KVGAnimator(animationState.perStrokeMs, function () {
				animationState.currentAnimator = null;
				animationState.timer = setTimeout(playOnce, animationState.loopPauseMs);
			});
			animationState.currentAnimator = animator;
			animator.play(currentSvg);
		};
		playOnce();
	}

	function randomHexColour() {
		var value = "";
		for (var i = 0; i < 3; i++) {
			var random = Math.floor(Math.random() * 12);
			value += random.toString(16).toUpperCase();
		}
		return "#" + value;
	}

	function firstKanji(text) {
		if (!text) {
			return null;
		}
		var cleaned = text.trim();
		if (!cleaned) {
			return null;
		}
		var match = hexKanji.exec(cleaned);
		if (match) {
			return String.fromCodePoint(parseInt(match[1], 16));
		}
		var chars = Array.from(cleaned);
		if (!chars.length) {
			return null;
		}
		return chars[0];
	}

	function setAllPaths(svg, stroke, width) {
		var paths = svg.getElementsByTagName("path");
		for (var i = 0; i < paths.length; i++) {
			paths[i].style.stroke = stroke;
			paths[i].style.strokeWidth = width;
		}
	}

	function collectRadicals(svg) {
		if (typeof findRadicals === "function") {
			return findRadicals(svg);
		}
		var groups = svg.getElementsByTagName("g");
		var radicals = {};
		for (var i = 0; i < groups.length; i++) {
			var radicalName = groups[i].getAttribute("kvg:radical");
			if (!radicalName) {
				continue;
			}
			if (!radicals[radicalName]) {
				radicals[radicalName] = [];
			}
			radicals[radicalName].push(groups[i].id);
		}
		return radicals;
	}

	function collectComponentGroups(svg) {
		if (typeof findSVGGroups === "function") {
			return findSVGGroups(svg);
		}
		var noElementLabel = (typeof noElement === "string") ? noElement : "No element";
		var groups = svg.getElementsByTagName("g");
		var componentGroups = {};
		for (var i = 0; i < groups.length; i++) {
			if (groups[i].id.match(/kvg:Stroke(Numbers|Paths)/)) {
				continue;
			}
			var element = groups[i].getAttribute("kvg:element");
			if (!element) {
				element = noElementLabel;
			}
			if (!componentGroups[element]) {
				componentGroups[element] = [];
			}
			componentGroups[element].push(groups[i].id);
		}
		return componentGroups;
	}

	function colourTextByStroke(svg) {
		var texts = svg.getElementsByTagName("text");
		var paths = svg.getElementsByTagName("path");
		for (var i = 0; i < texts.length; i++) {
			if (state.showStrokeOrders && paths[i]) {
				texts[i].style.fill = paths[i].style.stroke;
			} else {
				texts[i].style.fill = "none";
			}
		}
	}

	function highlightGroup(svg, groupID, colour, width) {
		var group = svg.getElementById(groupID);
		if (!group) {
			return 0;
		}
		var paths = group.getElementsByTagName("path");
		var changed = 0;
		for (var i = 0; i < paths.length; i++) {
			paths[i].style.stroke = colour;
			paths[i].style.strokeWidth = width;
			changed++;
		}
		return changed;
	}

	function applyNormalMode(svg) {
		var paths = svg.getElementsByTagName("path");
		for (var i = 0; i < paths.length; i++) {
			paths[i].style.stroke = randomHexColour();
			paths[i].style.strokeWidth = "4px";
		}
		return true;
	}

	function applyRadicalsMode(svg) {
		setAllPaths(svg, "#c8cfdb", "3px");
		var radicals = collectRadicals(svg);
		var keys = Object.keys(radicals);
		if (!keys.length) {
			return false;
		}
		var highlighted = {};
		for (var i = 0; i < keys.length; i++) {
			var groupIDs = radicals[keys[i]];
			for (var j = 0; j < groupIDs.length; j++) {
				highlighted[groupIDs[j]] = true;
			}
		}
		var highlightedCount = 0;
		for (var groupID in highlighted) {
			highlightedCount += highlightGroup(svg, groupID, "#c586d7", "6px");
		}
		return highlightedCount > 0;
	}

	function renderGroupsGrid(container) {
		if (typeof displayGroups !== "function") {
			return false;
		}
		var groupPanel = document.createElement("div");
		groupPanel.id = "group-images";
		container.appendChild(groupPanel);
		displayGroups(state.sourceSVG.cloneNode(true), state.kanji);
		var svgs = groupPanel.querySelectorAll("svg.group-svg");
		if (!svgs.length) {
			return false;
		}
		groupPanel.style.display = "grid";
		groupPanel.style.gap = "10px";
		groupPanel.style.gridTemplateColumns = "repeat(auto-fit, minmax(120px, 1fr))";
		groupPanel.style.width = "100%";
		for (var i = 0; i < svgs.length; i++) {
			svgs[i].style.width = "120px";
			svgs[i].style.height = "120px";
			svgs[i].style.maxWidth = "120px";
			svgs[i].style.maxHeight = "120px";
			svgs[i].style.margin = "0 auto";
		}
		return true;
	}

	function applyGroupsMode(svg) {
		setAllPaths(svg, "#c8cfdb", "3px");
		var components = collectComponentGroups(svg);
		var keys = Object.keys(components).sort();
		var noElementLabel = (typeof noElement === "string") ? noElement : "No element";
		var selfKanji = Array.from(state.kanji || "")[0];
		var changed = 0;
		var colourIndex = 0;
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key === selfKanji || key === noElementLabel) {
				continue;
			}
			var colour = groupPalette[colourIndex % groupPalette.length];
			colourIndex++;
			var groupIDs = components[key];
			for (var j = 0; j < groupIDs.length; j++) {
				changed += highlightGroup(svg, groupIDs[j], colour, "5px");
			}
		}
		return changed > 0;
	}

	function renderCurrentKanji() {
		if (!state.sourceSVG) {
			return;
		}
		clearMessage();
		var container = kanjiImage();
		container.innerHTML = "";
		if (state.mode === modeNames.groups) {
			stopAnimationLoop();
			container.style.alignItems = "stretch";
			container.style.justifyContent = "stretch";
			container.style.overflowY = "auto";
			if (!renderGroupsGrid(container)) {
				setMessage("This kanji does not include component group metadata.");
			}
			return;
		}
		container.style.alignItems = "";
		container.style.justifyContent = "";
		container.style.overflowY = "";
		var svg = state.sourceSVG.cloneNode(true);
		svg.id = "kanji-svg";
		var modeHandled = true;
		if (state.mode === modeNames.radicals) {
			modeHandled = applyRadicalsMode(svg);
			if (!modeHandled) {
				setMessage("This kanji does not include radical metadata.");
			}
		} else {
			applyNormalMode(svg);
		}
		colourTextByStroke(svg);
		container.appendChild(svg);
		startAnimationLoop();
	}

	function loadKanjiFromState() {
		var url;
		if (state.file) {
			url = fileToKanjiVG(state.file);
			state.kanji = fileToKanji(state.file);
		} else if (state.kanji) {
			url = kanjiURL(state.kanji);
		} else {
			setMessage("Enter a kanji to display.");
			return;
		}
		var requestID = ++state.requestID;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.overrideMimeType("image/svg+xml");
		xhr.onload = function () {
			if (requestID !== state.requestID) {
				return;
			}
			if (this.readyState !== 4) {
				return;
			}
			if (this.status === 200 && xhr.responseXML && xhr.responseXML.documentElement) {
				state.sourceSVG = xhr.responseXML.documentElement;
				document.title = state.kanji + " - Focus Viewer - KanjiVG";
				kanjiInput().value = state.kanji;
				renderCurrentKanji();
				return;
			}
			kanjiImage().innerHTML = "";
			if (this.status === 404) {
				setMessage("This character is not covered by KanjiVG.");
				return;
			}
			setMessage("Unable to load this character (" + this.status + ").");
		};
		xhr.onerror = function () {
			if (requestID !== state.requestID) {
				return;
			}
			kanjiImage().innerHTML = "";
			setMessage("Network error while loading the kanji data.");
		};
		xhr.send("");
	}

	function setMode(mode) {
		if (!modeNames[mode]) {
			return;
		}
		state.mode = mode;
		updateModeButtons();
		renderCurrentKanji();
	}

	function drawFromInput() {
		var kanji = firstKanji(kanjiInput().value);
		if (!kanji) {
			setMessage("Enter a kanji or hexadecimal code point.");
			return;
		}
		state.file = null;
		state.kanji = kanji;
		loadKanjiFromState();
	}

	function randomKanjiAction() {
		if (!index) {
			loadIndex();
		}
		state.file = null;
		state.kanji = randomKanji();
		kanjiInput().value = state.kanji;
		loadKanjiFromState();
	}

	function loadInitialState() {
		loadIndex();
		var vars = getUrlVars();
		var queryKanji = firstKanji(vars["kanji"]);
		if (vars["file"]) {
			state.file = vars["file"];
		}
		if (queryKanji) {
			state.file = null;
			state.kanji = queryKanji;
		}
		if (vars["mode"] && modeNames[vars["mode"]]) {
			state.mode = vars["mode"];
		}
		if (vars["strokes"] === "off") {
			state.showStrokeOrders = false;
		}
	}

		jQuery(document).ready(function () {
		loadInitialState();
		updateModeButtons();
		updateStrokeButton();
		kanjiInput().value = state.kanji;
		applySpeedLevel(defaultSpeedLevel);
		if (speedSlider()) {
			speedSlider().value = String(defaultSpeedLevel);
		}

		jQuery("#focus-controls").submit(function () {
			drawFromInput();
			return false;
		});

		jQuery("#focus-random").click(function () {
			randomKanjiAction();
			return false;
		});

		jQuery(".focus-mode-button").click(function () {
			setMode(this.dataset.mode);
			return false;
		});

		jQuery("#focus-stroke-toggle").click(function () {
			state.showStrokeOrders = !state.showStrokeOrders;
			updateStrokeButton();
			renderCurrentKanji();
			return false;
		});

		var speed = speedSlider();
		if (speed) {
			var onSpeedChange = function () {
				applySpeedLevel(this.value);
				if (state.mode !== modeNames.groups) {
					startAnimationLoop();
				}
			};
			speed.addEventListener("input", onSpeedChange);
			speed.addEventListener("change", onSpeedChange);
		}

		jQuery("#focus-animate").click(function () {
			startAnimationLoop();
			return false;
		});
		loadKanjiFromState();
	});
})();

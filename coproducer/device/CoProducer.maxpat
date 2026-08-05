{
	"patcher": {
		"fileversion": 1,
		"appversion": {
			"major": 8,
			"minor": 5,
			"revision": 6,
			"architecture": "x64",
			"modernui": 1
		},
		"classnamespace": "box",
		"rect": [59.0, 106.0, 1240.0, 800.0],
		"openrect": [0.0, 0.0, 0.0, 169.0],
		"bglocked": 0,
		"openinpresentation": 1,
		"default_fontsize": 12.0,
		"default_fontface": 0,
		"default_fontname": "Arial",
		"gridonopen": 1,
		"gridsize": [15.0, 15.0],
		"gridsnaponopen": 1,
		"objectsnaponopen": 1,
		"statusbarvisible": 2,
		"toolbarvisible": 1,
		"lefttoolbarpinned": 0,
		"toptoolbarpinned": 0,
		"righttoolbarpinned": 0,
		"bottomtoolbarpinned": 0,
		"toolbars_unpinned_last_save": 0,
		"tallnewobj": 0,
		"boxanimatetime": 200,
		"enablehscroll": 1,
		"enablevscroll": 1,
		"devicewidth": 0.0,
		"description": "",
		"digest": "",
		"tags": "",
		"style": "",
		"subpatcher_template": "",
		"assistshowspatchername": 0,
		"boxes": [
			{
				"box": {
					"id": "obj-1",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [30.0, 15.0, 900.0, 20.0],
					"text": "CoProducer device. Flow: jweb UI talks to node.script over ws://127.0.0.1:7400. node.script talks to the js LOM bridge over [cmd json] messages. The bridge talks to Live via LiveAPI."
				}
			},
			{
				"box": {
					"id": "obj-2",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [30.0, 55.0, 480.0, 20.0],
					"text": "1) Node backend. Runs node/main.js (WebSocket server plus module wiring)."
				}
			},
			{
				"box": {
					"id": "obj-3",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": ["", ""],
					"patching_rect": [30.0, 85.0, 360.0, 22.0],
					"text": "node.script ../node/main.js @autostart 1 @watch 0"
				}
			},
			{
				"box": {
					"id": "obj-4",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [30.0, 130.0, 620.0, 20.0],
					"text": "2) LOM bridge. node.script left outlet feeds the js object, and the js outlet feeds node.script's inlet (direct patch cords, no send or receive pairs)."
				}
			},
			{
				"box": {
					"id": "obj-5",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [""],
					"patching_rect": [90.0, 165.0, 120.0, 22.0],
					"text": "js lom-bridge.js"
				}
			},
			{
				"box": {
					"id": "obj-6",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [660.0, 55.0, 420.0, 20.0],
					"text": "3) Round trip test. Click the button, then watch the Max window for PASS or FAIL."
				}
			},
			{
				"box": {
					"id": "obj-7",
					"maxclass": "live.text",
					"mode": 0,
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": ["", ""],
					"parameter_enable": 1,
					"patching_rect": [660.0, 85.0, 160.0, 24.0],
					"presentation": 1,
					"presentation_rect": [10.0, 44.0, 160.0, 26.0],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_enum": ["off", "on"],
							"parameter_longname": "RunRoundTrip",
							"parameter_mmax": 1,
							"parameter_shortname": "RoundTrip",
							"parameter_type": 2
						}
					},
					"text": "Run LOM round trip",
					"texton": "Run LOM round trip"
				}
			},
			{
				"box": {
					"id": "obj-8",
					"maxclass": "message",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [""],
					"patching_rect": [660.0, 125.0, 76.0, 22.0],
					"text": "roundtrip"
				}
			},
			{
				"box": {
					"id": "obj-9",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [30.0, 215.0, 900.0, 20.0],
					"text": "4) UI. The full interface is 900 by 620, far taller than the 169 pixel Live device strip, so it lives in the coproducer-ui subpatcher and opens in its own window. pcontrol opens it."
				}
			},
			{
				"box": {
					"id": "obj-10",
					"maxclass": "live.text",
					"mode": 0,
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": ["", ""],
					"parameter_enable": 1,
					"patching_rect": [30.0, 245.0, 160.0, 24.0],
					"presentation": 1,
					"presentation_rect": [10.0, 10.0, 160.0, 26.0],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_enum": ["off", "on"],
							"parameter_longname": "OpenCoProducer",
							"parameter_mmax": 1,
							"parameter_shortname": "Open",
							"parameter_type": 2
						}
					},
					"text": "Open CoProducer",
					"texton": "Open CoProducer"
				}
			},
			{
				"box": {
					"id": "obj-11",
					"maxclass": "message",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [""],
					"patching_rect": [30.0, 285.0, 46.0, 22.0],
					"text": "open"
				}
			},
			{
				"box": {
					"id": "obj-12",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [""],
					"patching_rect": [30.0, 320.0, 60.0, 22.0],
					"text": "pcontrol"
				}
			},
			{
				"box": {
					"id": "obj-13",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [30.0, 355.0, 120.0, 22.0],
					"text": "p coproducer-ui",
					"patcher": {
						"fileversion": 1,
						"appversion": {
							"major": 8,
							"minor": 5,
							"revision": 6,
							"architecture": "x64",
							"modernui": 1
						},
						"classnamespace": "box",
						"rect": [140.0, 120.0, 900.0, 620.0],
						"bglocked": 1,
						"openinpresentation": 1,
						"default_fontsize": 12.0,
						"default_fontface": 0,
						"default_fontname": "Arial",
						"gridonopen": 1,
						"gridsize": [15.0, 15.0],
						"gridsnaponopen": 1,
						"objectsnaponopen": 1,
						"statusbarvisible": 0,
						"toolbarvisible": 0,
						"lefttoolbarpinned": 0,
						"toptoolbarpinned": 0,
						"righttoolbarpinned": 0,
						"bottomtoolbarpinned": 0,
						"toolbars_unpinned_last_save": 0,
						"tallnewobj": 0,
						"boxanimatetime": 200,
						"enablehscroll": 1,
						"enablevscroll": 1,
						"devicewidth": 0.0,
						"description": "",
						"digest": "",
						"tags": "",
						"style": "",
						"subpatcher_template": "",
						"assistshowspatchername": 0,
						"boxes": [
							{
								"box": {
									"comment": "",
									"id": "sub-1",
									"index": 1,
									"maxclass": "inlet",
									"numinlets": 0,
									"numoutlets": 1,
									"outlettype": [""],
									"patching_rect": [20.0, 20.0, 30.0, 30.0]
								}
							},
							{
								"box": {
									"id": "sub-2",
									"maxclass": "newobj",
									"numinlets": 1,
									"numoutlets": 1,
									"outlettype": ["bang"],
									"patching_rect": [80.0, 20.0, 70.0, 22.0],
									"text": "loadbang"
								}
							},
							{
								"box": {
									"id": "sub-5",
									"maxclass": "newobj",
									"numinlets": 2,
									"numoutlets": 1,
									"outlettype": ["bang"],
									"patching_rect": [80.0, 55.0, 80.0, 22.0],
									"text": "del 2000"
								}
							},
							{
								"box": {
									"id": "sub-3",
									"maxclass": "message",
									"numinlets": 2,
									"numoutlets": 1,
									"outlettype": [""],
									"patching_rect": [80.0, 55.0, 200.0, 22.0],
									"text": "url ../ui/dist/index.html"
								}
							},
							{
								"box": {
									"id": "sub-4",
									"maxclass": "newobj",
									"numinlets": 1,
									"numoutlets": 2,
									"outlettype": ["", ""],
									"patching_rect": [80.0, 95.0, 900.0, 620.0],
									"presentation": 1,
									"presentation_rect": [0.0, 0.0, 900.0, 620.0],
									"text": "jweb"
								}
							}
						],
						"lines": [
							{
								"patchline": {
									"source": ["sub-2", 0],
									"destination": ["sub-5", 0]
								}
							},
							{
								"patchline": {
									"source": ["sub-5", 0],
									"destination": ["sub-3", 0]
								}
							},
							{
								"patchline": {
									"source": ["sub-1", 0],
									"destination": ["sub-3", 0]
								}
							},
							{
								"patchline": {
									"source": ["sub-3", 0],
									"destination": ["sub-4", 0]
								}
							}
						]
					}
				}
			},
			{
				"box": {
					"id": "obj-14",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [980.0, 130.0, 240.0, 20.0],
					"text": "MIDI passthrough so the device does not block the track."
				}
			},
			{
				"box": {
					"id": "obj-15",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": ["int"],
					"patching_rect": [980.0, 160.0, 50.0, 22.0],
					"text": "midiin"
				}
			},
			{
				"box": {
					"id": "obj-16",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [980.0, 200.0, 55.0, 22.0],
					"text": "midiout"
				}
			}
		],
		"lines": [
			{
				"patchline": {
					"source": ["obj-3", 0],
					"destination": ["obj-5", 0]
				}
			},
			{
				"patchline": {
					"source": ["obj-5", 0],
					"destination": ["obj-3", 0]
				}
			},
			{
				"patchline": {
					"source": ["obj-7", 0],
					"destination": ["obj-8", 0]
				}
			},
			{
				"patchline": {
					"source": ["obj-8", 0],
					"destination": ["obj-3", 0]
				}
			},
			{
				"patchline": {
					"source": ["obj-10", 0],
					"destination": ["obj-11", 0]
				}
			},
			{
				"patchline": {
					"source": ["obj-11", 0],
					"destination": ["obj-12", 0]
				}
			},
			{
				"patchline": {
					"source": ["obj-12", 0],
					"destination": ["obj-13", 0]
				}
			},
			{
				"patchline": {
					"source": ["obj-10", 0],
					"destination": ["obj-13", 0]
				}
			},
			{
				"patchline": {
					"source": ["obj-15", 0],
					"destination": ["obj-16", 0]
				}
			}
		],
		"dependency_cache": [],
		"autosave": 0
	}
}

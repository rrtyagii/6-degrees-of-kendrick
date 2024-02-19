"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var KENDRICK_LAMAR_SPOTIFY_ID = "2YZyLoL8N0Wb9xBt1NhZWg";
var ALBUM_ID = "";
var INCLUDE_GROUPS = ["album", "single", "appears_on", "compilation"];
var LIMIT = 50;
var OFFSET = 0;
function appendOrCreateJSONFile(filename, data) {
    return __awaiter(this, void 0, void 0, function () {
        var currentFileData, existingData, existingIds_1, uniqueNewData, combinedData, combinedDataJson, error_1, combinedDataJson;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 7]);
                    return [4 /*yield*/, fs.promises.readFile(filename, "utf-8")];
                case 1:
                    currentFileData = _a.sent();
                    existingData = JSON.parse(currentFileData);
                    existingIds_1 = new Set(existingData.map(function (item) { return item.id; }));
                    uniqueNewData = data.filter(function (item) { return !existingIds_1.has(item.id); });
                    if (uniqueNewData.length === 0) {
                        console.log('No unique data to append. No changes made to the file.');
                        return [2 /*return*/];
                    }
                    combinedData = __spreadArray(__spreadArray([], existingData, true), uniqueNewData, true);
                    combinedDataJson = JSON.stringify(combinedData, null, 2);
                    return [4 /*yield*/, fs.promises.writeFile(filename, combinedDataJson)];
                case 2:
                    _a.sent();
                    console.log("File updated successfully");
                    return [3 /*break*/, 7];
                case 3:
                    error_1 = _a.sent();
                    if (!(error_1.code === "ENOENT")) return [3 /*break*/, 5];
                    console.log("File not found");
                    combinedDataJson = JSON.stringify(data, null, 2);
                    return [4 /*yield*/, fs.promises.writeFile(filename, combinedDataJson)];
                case 4:
                    _a.sent();
                    console.log("File created successfully");
                    return [3 /*break*/, 6];
                case 5:
                    console.error('An error occurred:', error_1);
                    _a.label = 6;
                case 6: return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function authorizeSpotify() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://accounts.spotify.com/api/token", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        credentials: 'include',
                        body: "grant_type=client_credentials&client_id=".concat(process.env.CLIENT_ID, "&client_secret=").concat(process.env.CLIENT_SECRET)
                    })];
                case 1:
                    response = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 7]);
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 4:
                    console.log("process.env.CLIENT_ID ", process.env.CLIENT_ID);
                    throw new Error("Response not OK");
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    console.error("error\n", e_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
var getArtistsAlbums = function (_a) {
    var access_token = _a.access_token, artist_spotify_id = _a.artist_spotify_id, include_groups = _a.include_groups, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
    return __awaiter(void 0, void 0, void 0, function () {
        var GET_ARTIST_ALBUM_ENDPOINT, response, data, e_2;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    GET_ARTIST_ALBUM_ENDPOINT = "https://api.spotify.com/v1/artists/".concat(artist_spotify_id, "/albums?include_groups=").concat(include_groups, "&market=US&limit=").concat(limit, "&offset=").concat(offset);
                    return [4 /*yield*/, fetch(GET_ARTIST_ALBUM_ENDPOINT, {
                            method: "GET",
                            headers: { "Authorization": "Bearer ".concat(access_token) }
                        })];
                case 1:
                    response = _d.sent();
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 6, , 7]);
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _d.sent();
                    return [2 /*return*/, data];
                case 4: throw new Error("Response not OK");
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_2 = _d.sent();
                    console.error("error\n", e_2);
                    return [2 /*return*/, e_2];
                case 7: return [2 /*return*/];
            }
        });
    });
};
var getAlbumTracks = function (_a) {
    var access_token = _a.access_token, album_id = _a.album_id, _b = _a.market, market = _b === void 0 ? 'US' : _b, _c = _a.limit, limit = _c === void 0 ? 50 : _c, _d = _a.offset, offset = _d === void 0 ? 0 : _d;
    return __awaiter(void 0, void 0, void 0, function () {
        var GET_ALBUM_TRACKS_ENDPOINT, response, data, e_3;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    GET_ALBUM_TRACKS_ENDPOINT = "https://api.spotify.com/v1/albums/".concat(album_id, "/tracks?market=").concat(market, "&limit=").concat(limit, "&offset=").concat(offset);
                    return [4 /*yield*/, fetch(GET_ALBUM_TRACKS_ENDPOINT, {
                            method: "GET",
                            headers: { "Authorization": "Bearer ".concat(access_token) }
                        })];
                case 1:
                    response = _e.sent();
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 6, , 7]);
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _e.sent();
                    return [2 /*return*/, data];
                case 4: throw new Error("Response not OK");
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_3 = _e.sent();
                    console.error("error\n", e_3);
                    return [2 /*return*/, e_3];
                case 7: return [2 /*return*/];
            }
        });
    });
};
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var authorizationResult, getArtistAlbum, items, id, albumData, i, j, album_object;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, authorizeSpotify()];
                case 1:
                    authorizationResult = _a.sent();
                    if (!!authorizationResult) return [3 /*break*/, 2];
                    console.error("Authorization failed");
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, getArtistsAlbums({
                        access_token: authorizationResult.access_token,
                        artist_spotify_id: KENDRICK_LAMAR_SPOTIFY_ID,
                        include_groups: INCLUDE_GROUPS[0],
                        limit: LIMIT,
                        offset: OFFSET,
                    })];
                case 3:
                    getArtistAlbum = _a.sent();
                    _a.label = 4;
                case 4:
                    items = getArtistAlbum["items"];
                    id = 0;
                    albumData = [];
                    i = 0;
                    _a.label = 5;
                case 5:
                    if (!(i < items.length)) return [3 /*break*/, 10];
                    j = 0;
                    _a.label = 6;
                case 6:
                    if (!(j < items[i]['artists'].length)) return [3 /*break*/, 9];
                    album_object = {
                        "id": "".concat(++id),
                        "name": items[i]['name'],
                        "artist": {
                            'spotify_id': items[i]['artists'][j]['id'],
                            'name': items[i]['artists'][j]['name']
                        },
                        "spotify_id": items[i]['id'],
                        "total_tracks": items[i]['total_tracks'],
                        "album_group": items[i]['album_group'],
                        "album_type": items[i]['album_type'],
                    };
                    albumData.push((album_object));
                    return [4 /*yield*/, appendOrCreateJSONFile("albumData.json", albumData)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    j++;
                    return [3 /*break*/, 6];
                case 9:
                    i++;
                    return [3 /*break*/, 5];
                case 10:
                    ;
                    return [2 /*return*/];
            }
        });
    });
}
main();

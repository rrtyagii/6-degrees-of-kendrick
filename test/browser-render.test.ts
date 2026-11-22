import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

class Element {
    children: Element[] = [];
    textContent = "";
    className = "";
    hidden = false;
    src = "";
    loading = "";
    width = "";
    height = "";
    title = "";
    allow = "";
    sandbox = "";
    referrerPolicy = "";
    classList = { remove() {} };

    constructor(public tagName = "div") {}
    append(...children: Element[]) { this.children.push(...children); }
    replaceChildren(...children: Element[]) { this.children = children; }
    addEventListener() {}
    querySelector() { return new Element("button"); }
}

function renderer() {
    const nodes = new Map<string, Element>();
    const document = {
        getElementById(id: string) {
            if (!nodes.has(id)) nodes.set(id, new Element());
            return nodes.get(id)!;
        },
        createElement(tag: string) { return new Element(tag); },
        addEventListener() {},
    };
    const context = vm.createContext({ document });
    vm.runInContext(readFileSync(path.resolve("src/formScript.js"), "utf8"), context);
    const render = (data: unknown, name = "Drake") => {
        context.data = data;
        context.name = name;
        vm.runInContext("displayDegreeOfSeparation(data, name)", context);
        return document.getElementById("tracks");
    };
    return { render, document };
}

const track = { name: "Example track", spotifyId: "1234567890123456789012" };

test("results automatically render lazy Spotify players with reserved dimensions and security restrictions", () => {
    const { render } = renderer();
    const tracks = render({ degree: 1, path: [{ artist: "Drake", track }] });
    const [heading, title, frame] = tracks.children[0].children;
    assert.equal(heading.textContent, "Kendrick Lamar / Drake");
    assert.equal(title.textContent, track.name);
    assert.equal(frame.tagName, "iframe");
    assert.equal(frame.src, `https://open.spotify.com/embed/track/${track.spotifyId}?theme=0`);
    assert.equal(frame.loading, "lazy");
    assert.equal(frame.width, "640");
    assert.equal(frame.height, "152");
    assert.equal(frame.title, track.name);
    assert.equal(frame.referrerPolicy, "no-referrer");
    assert.equal(frame.allow, "encrypted-media; fullscreen; picture-in-picture");
    assert.equal(frame.sandbox, "allow-forms allow-popups allow-presentation allow-same-origin allow-scripts");
    assert.equal(tracks.children[0].children.some(child => child.tagName === "button"), false);
});

test("invalid Spotify IDs do not create frames and metadata remains literal text", () => {
    for (const spotifyId of ["https://attacker.example/", "../track", '123456789012345678901"', ""]) {
        const { render } = renderer();
        const artist = '<img src=x onerror="alert(1)">';
        const name = "<script>alert(1)</script>";
        const tracks = render({ degree: 1, path: [{ artist, track: { name, spotifyId } }] });
        assert.equal(tracks.children[0].children.length, 2);
        assert.equal(tracks.children[0].children[0].textContent, `Kendrick Lamar / ${artist}`);
        assert.equal(tracks.children[0].children[1].textContent, name);
    }
});

test("subsequent results replace old players and zero-degree results clear them", () => {
    const { render, document } = renderer();
    const data = { degree: 1, path: [{ artist: "Drake", track }] };
    const tracks = render(data);
    const previous = tracks.children[0];
    render(data);
    assert.equal(tracks.children.length, 1);
    assert.notEqual(tracks.children[0], previous);
    render({ degree: 0, path: [] }, "Kendrick Lamar");
    assert.equal(tracks.children.length, 0);
    assert.equal(document.getElementById("connection-heading").hidden, true);
});

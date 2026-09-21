import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".mjs":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8"};
const server=createServer(async(req,res)=>{
  try {
    const route=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const resolved=resolve(root,"."+route.replace(/\/$/,"/index.html"));
    if(resolved!==root&&!resolved.startsWith(root+sep))throw new Error("invalid path");
    const data=await readFile(resolved);
    res.writeHead(200,{"Content-Type":mime[extname(resolved)]??"application/octet-stream"});
    res.end(data);
  }catch {res.writeHead(404);res.end("not found");}
});
await new Promise(resolveReady=>server.listen(0,"127.0.0.1",resolveReady));
const address=server.address();
let browser;
const failures=[];
async function prepare(page){
  await page.goto(`http://127.0.0.1:${address.port}/`,{waitUntil:"domcontentloaded"});
  await page.getByRole("checkbox",{name:"Include Grace · The House"}).uncheck();
  await page.getByRole("checkbox",{name:"Include GrooveRooms"}).check();
  await page.getByRole("button",{name:/Compose this room/}).click();
  await page.getByRole("button",{name:"Visit the listening room"}).waitFor();
}
try {
  browser=await chromium.launch({headless:true,
    args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader",
      "--enable-webgl","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,
    isMobile:true,hasTouch:true});
  page.on("pageerror",err=>failures.push(err.message));
  await prepare(page);
  const before=await page.evaluate(()=>localStorage.getItem("static-play.seedplate-001.local-run.v1"));
  await page.getByRole("button",{name:"Visit the listening room"}).click();
  await page.locator("#room-canvas").count(); // Canvas class is .room-canvas.
  await page.locator(".room-canvas").waitFor({state:"visible",timeout:30000});
  const dimensions=await page.locator(".room-canvas").evaluate(el=>({
    width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
    pixels:el.width*el.height,
  }));
  assert.ok(dimensions.width>250&&dimensions.height>200&&dimensions.pixels>50000,
    `Room canvas was not actually sized: ${JSON.stringify(dimensions)}`);
  assert.equal(await page.evaluate(()=>localStorage.getItem("static-play.seedplate-001.local-run.v1")),before,
    "Entering a visual mode cannot append gameplay events");
  const chair=page.getByRole("button",{name:"Listening chair"});
  assert.ok((await chair.boundingBox()).height>=44,"Chair DOM target below 44px");
  await chair.click();
  await page.getByRole("button",{name:"Do it"}).click();
  await page.getByRole("button",{name:"Return to the room"}).click();
  await page.getByRole("button",{name:"Picture machine"}).click();
  await page.getByRole("button",{name:"Do it"}).click();
  await page.getByRole("button",{name:/The chair has a second shadow/}).click();
  await page.getByRole("button",{name:"KEEP this scene"}).click();
  await page.getByRole("button",{name:"Return to the room"}).click();
  await page.getByRole("button",{name:"Listening chair"}).click();
  await page.getByText("Leave a listening echo of the kept scene").first().waitFor();
  await page.getByRole("button",{name:"Do it"}).click();
  const trace=await page.evaluate(()=>JSON.parse(localStorage.getItem("static-play.seedplate-001.local-run.v1")));
  assert.equal(trace.events.length,6);
  assert.equal(trace.events[3].type,"keep");
  assert.equal(trace.events[5].actionId,"groove:echo");
  await page.getByRole("button",{name:"Back to simple view"}).click();
  const after=await page.evaluate(()=>localStorage.getItem("static-play.seedplate-001.local-run.v1"));
  assert.equal(after,JSON.stringify(trace,null,2),"Visual-mode change rewrote the saved run");
  await page.reload();
  assert.equal(await page.evaluate(()=>localStorage.getItem("static-play.seedplate-001.local-run.v1")),after,
    "Reload lost the retained run");
  await page.screenshot({path:"listening-room-phone.png",fullPage:true});
  assert.deepEqual(failures,[],"Browser page errors: "+failures.join("; "));
  console.log("PASS mobile three.js canvas, two DOM hotspots, KEEP→echo, replay parity, mode switch and reload");
  console.log("Canvas dimensions: "+JSON.stringify(dimensions));
  await page.close();

  const fallback=await browser.newPage({viewport:{width:390,height:844}});
  await fallback.route("https://cdn.jsdelivr.net/npm/three@0.180.0/**",route=>route.abort());
  await prepare(fallback);
  await fallback.getByRole("button",{name:"Visit the listening room"}).click();
  await fallback.getByText("3D is unavailable here. The simple game remains fully playable.").waitFor({timeout:30000});
  assert.equal(await fallback.locator(".room-canvas").count(),0,
    "Fallback retained an unusable canvas");
  assert.ok(await fallback.getByRole("button",{name:/Look through the picture machine/}).isVisible());
  console.log("PASS offline graphics dependency fallback retains flat-game actions");
  await fallback.close();
} finally {
  if(browser)await browser.close();
  await new Promise(done=>server.close(done));
}

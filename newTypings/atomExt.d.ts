/// <reference path="../typings/emissary/emissary.d.ts" />
/// <reference path="../typings/emissary/emissary.d.ts" />

import Emissary = require("emissary");

declare module "atom"{
    class Emitter extends Emissary.Emitter{
    }
}

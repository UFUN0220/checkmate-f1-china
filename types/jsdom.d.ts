declare module "jsdom" {
  export class JSDOM {
    readonly window: { document: Document };
    constructor(html: string);
  }
}

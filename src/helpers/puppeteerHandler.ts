import puppeteer from 'puppeteer';

type PuppeteerJob<T> = (page: puppeteer.Page) => Promise<T>;

export class PuppeteerHandler {
  private static instance: PuppeteerHandler;
  private browser: puppeteer.Browser;
  private jobs: PuppeteerJob<unknown>[];

  private constructor() {
    this.jobs = [];
  }

  public static getInstance(): PuppeteerHandler {
    if (!PuppeteerHandler.instance) {
      PuppeteerHandler.instance = new PuppeteerHandler();
    }

    return PuppeteerHandler.instance;
  }

  public async addJob<T>(job: PuppeteerJob<T>): Promise<T> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({ timeout: 2000 });
    }
    this.jobs.push(job);

    while (this.jobs[0] !== job) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    const page = await this.browser.newPage();
    try {
      return await job(page);
    } finally {
      this.jobs.shift();
      await page.close();
    }
  }
}

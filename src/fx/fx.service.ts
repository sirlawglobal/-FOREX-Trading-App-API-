import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import Decimal from 'decimal.js';



@Injectable()
export class FxService {
  private logger = new Logger(FxService.name);
  private rates: Map<string, Decimal> = new Map(); // Cache; scale to Redis
  private lastFetch: Date = new Date(0);
  private readonly supportedToCurrencies: string[];

  constructor(private http: HttpService, private config: ConfigService) {
    this.supportedToCurrencies = this.config.get('SUPPORTED_TO_CURRENCIES').split(',');
    this.refreshRates();
    setInterval(() => this.refreshRates(), 300000); // 5 min
  }

  private async refreshRates() {
    try {
      const res = await firstValueFrom(this.http.get(`https://api.exchangerate-api.com/v4/latest/NGN?access_key=${this.config.get('FX_API_KEY')}`));
      const data = res.data.rates;
      for (const [curr, rate] of Object.entries(data)) {
        this.rates.set(`NGN_${curr}`, new Decimal(rate as number));
      }
      this.lastFetch = new Date();
      this.logger.log('Rates refreshed');
    } catch (err) {
      this.logger.error('Fetch failed', err); // Retry or fallback
    }
  }

  async getRate(from: string, to: string): Promise<Decimal | null> {
    if (Date.now() - this.lastFetch.getTime() > 600000) await this.refreshRates(); // 10 min stale
    const key = `${from}_${to}`;
    const inverse = `${to}_${from}`;

    const rate = this.rates.get(key);
    if (rate !== undefined) return rate;

    const invRate = this.rates.get(inverse);
    if (invRate !== undefined) return new Decimal(1).div(invRate);

    return null;
  }

//   getAllRates() {
//     return Array.from(this.rates, ([key, value]) => ({ key, rate: value.toString() }));
//   }

getAllRates() {
  // Get ALL cached pairs (original behavior - nothing is discarded)
  const allPairs = Array.from(this.rates.entries()).map(([key, value]) => ({
    pair: key,                    // e.g. "NGN_USD"
    rate: value.toString(),
  }));

  // Filter to only include supported ones
  const filteredPairs = allPairs.filter(item => {
    const toCurrency = item.pair.split('_')[1]; // extract "USD", "EUR", etc.
    return this.supportedToCurrencies.includes(toCurrency);
  });

  // Return richer structure (recommended for clarity)
  return {
    base: 'NGN',
    lastUpdated: this.lastFetch.toISOString(),
    supportedPairs: this.supportedToCurrencies, // tells frontend what is usable
    totalCachedPairs: allPairs.length,          // optional: shows full API coverage
    pairs: filteredPairs,
  };
}
}
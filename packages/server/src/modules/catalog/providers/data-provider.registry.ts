import { Injectable, Inject, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { DataProvider, DATA_PROVIDERS } from './data-provider.interface';

@Injectable()
export class DataProviderRegistry {
  constructor(
    @Inject(DATA_PROVIDERS)
    private readonly providers: DataProvider[],
  ) {}

  getAll(): DataProvider[] {
    return this.providers;
  }

  getAvailable(): DataProvider[] {
    return this.providers.filter((p) => p.isAvailable());
  }

  get(name: string): DataProvider {
    const provider = this.providers.find((p) => p.name === name);
    if (!provider) throw new NotFoundException(`Provider "${name}" not found`);
    if (!provider.isAvailable()) throw new BadRequestException(`Provider "${name}" is not configured or unavailable`);
    return provider;
  }

  getDefault(dataType: DataProvider['dataType'] = 'nutrition'): DataProvider {
    const available = this.getAvailable().filter((p) => p.dataType === dataType);
    if (available.length === 0) {
      throw new ServiceUnavailableException(`No ${dataType} providers are configured`);
    }
    return available[0];
  }
}

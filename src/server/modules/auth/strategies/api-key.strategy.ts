import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(CustomStrategy, 'api-key') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    // Extract API key from query param or Authorization header
    let apiKey: string | undefined;

    // Check query parameter: ?api_key=xxx
    if (req.query.api_key && typeof req.query.api_key === 'string') {
      apiKey = req.query.api_key;
    }

    // Check Authorization header: "ApiKey xxx"
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('ApiKey ')) {
      apiKey = authHeader.substring(7);
    }

    if (!apiKey) {
      throw new UnauthorizedException('API key not provided');
    }

    // Validate API key
    const apiKeyRecord = await this.prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check expiration
    if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update lastUsed timestamp (async, don't wait)
    this.prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsed: new Date() },
    }).catch(() => {}); // Ignore errors on lastUsed update

    // Attach scopes and user to request
    return {
      user: apiKeyRecord.user,
      scopes: JSON.parse(apiKeyRecord.scopes),
      apiKeyId: apiKeyRecord.id,
    };
  }
}

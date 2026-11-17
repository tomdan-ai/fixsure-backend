import { Controller, Post, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { CurrentToken } from '../common/auth.decorator';
import { IdentityVerificationDto, TechnicianProfileDto } from './dto/verification.dto';

@ApiTags('Verification')
@ApiBearerAuth()
@Controller('api')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('verification/contact')
  @ApiOperation({ summary: 'Simulate contact verification (phone/email OTP)' })
  @ApiResponse({ status: 200, description: 'Contact marked as verified' })
  async verifyContact(@CurrentToken() token: string) {
    return this.verificationService.verifyContact(token);
  }

  @Post('verification/identity')
  @ApiOperation({ summary: 'Simulate identity verification (NIN/BVN check)' })
  @ApiResponse({ status: 200, description: 'Identity marked as verified' })
  async verifyIdentity(@CurrentToken() token: string, @Body() dto: IdentityVerificationDto) {
    return this.verificationService.verifyIdentity(token, dto.nin, dto.providerRef);
  }

  @Put('technician/profile')
  @ApiOperation({ summary: 'Set or update technician professional profile (categories, city, bio)' })
  @ApiResponse({ status: 200, description: 'Technician profile updated' })
  async updateTechnicianProfile(@CurrentToken() token: string, @Body() dto: TechnicianProfileDto) {
    return this.verificationService.updateTechnicianProfile(token, dto);
  }
}

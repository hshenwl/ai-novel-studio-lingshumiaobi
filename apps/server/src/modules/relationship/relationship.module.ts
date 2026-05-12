import { Module } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';

@Module({
  controllers: [RelationshipController],
  providers: [RelationshipService],
  exports: [RelationshipService],
})
export class RelationshipModule {}
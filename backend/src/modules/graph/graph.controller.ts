import { Body, Controller, Post } from '@nestjs/common';
import { GraphService } from './graph.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  /**
   * POST /api/graph/chat
   * Sends a message to the LangGraph and returns the response with metadata.
   */
  @Post('chat')
  async chat(@Body() dto: ChatMessageDto) {
    return this.graphService.chat(dto.message, dto.threadId);
  }
}

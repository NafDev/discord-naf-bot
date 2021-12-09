import { Collection, Message, TextBasedChannels } from 'discord.js';

export default async function scrapeMessages(
  channel: TextBasedChannels,
  messageProcessor: (message: Message) => void
): Promise<number> {
  let lastMessageId = null;
  let moreMessagesLeft = true;
  let processed = 0;

  while (moreMessagesLeft) {
    const history: Collection<string, Message> = await channel.messages.fetch(
      { limit: 100, before: lastMessageId || undefined },
      { cache: false, force: true }
    );

    history.forEach((message) => messageProcessor(message));

    const lastMessage = history.last();
    if (lastMessage instanceof Message) {
      lastMessageId = lastMessage.id;
    }

    processed += history.size;

    if (history.size < 100) {
      moreMessagesLeft = false;
    }
  }

  return processed;
}

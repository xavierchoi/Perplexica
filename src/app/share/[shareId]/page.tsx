'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import NextError from 'next/error';
import { BookCopy, Disc3, Share2 } from 'lucide-react';
import Markdown, { MarkdownToJSX, RuleType } from 'markdown-to-jsx';
import { cn } from '@/lib/utils';
import MessageSources from '@/components/MessageSources';
import ThinkBox from '@/components/ThinkBox';
import Citation from '@/components/MessageRenderer/Citation';
import CodeBlock from '@/components/MessageRenderer/CodeBlock';
import Loader from '@/components/ui/Loader';
import { Block } from '@/lib/types';

interface Message {
  messageId: string;
  chatId: string;
  query: string;
  responseBlocks: Block[];
  status: string;
  createdAt: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  sources: string[];
}

const ThinkTagProcessor = ({
  children,
  thinkingEnded,
}: {
  children: React.ReactNode;
  thinkingEnded: boolean;
}) => {
  return (
    <ThinkBox content={children as string} thinkingEnded={thinkingEnded} />
  );
};

const SharedMessageBox = ({ message }: { message: Message }) => {
  const { parsedTextBlocks, thinkingEnded, sources } = useMemo(() => {
    const textBlocks: string[] = [];
    let thinkingEnded = false;

    const sourceBlocks = message.responseBlocks.filter(
      (block): block is Block & { type: 'source' } => block.type === 'source',
    );
    const sources = sourceBlocks.flatMap((block) => block.data);

    message.responseBlocks.forEach((block) => {
      if (block.type === 'text') {
        let processedText = block.data;
        const citationRegex = /\[([^\]]+)\]/g;

        if (processedText.includes('<think>')) {
          const openThinkTag = processedText.match(/<think>/g)?.length || 0;
          const closeThinkTag =
            processedText.match(/<\/think>/g)?.length || 0;

          if (openThinkTag && !closeThinkTag) {
            processedText += '</think> <a> </a>';
          }
        }

        if (block.data.includes('</think>')) {
          thinkingEnded = true;
        }

        if (sources.length > 0) {
          processedText = processedText.replace(
            citationRegex,
            (_, capturedContent: string) => {
              const numbers = capturedContent
                .split(',')
                .map((numStr) => numStr.trim());

              const linksHtml = numbers
                .map((numStr) => {
                  const number = parseInt(numStr);

                  if (isNaN(number) || number <= 0) {
                    return `[${numStr}]`;
                  }

                  const source = sources[number - 1];
                  const url = source?.metadata?.url;

                  if (url) {
                    return `<citation href="${url}">${numStr}</citation>`;
                  } else {
                    return ``;
                  }
                })
                .join('');

              return linksHtml;
            },
          );
        } else {
          const regex = /\[(\d+)\]/g;
          processedText = processedText.replace(regex, '');
        }

        textBlocks.push(processedText);
      }
    });

    return { parsedTextBlocks: textBlocks, thinkingEnded, sources };
  }, [message.responseBlocks]);

  const parsedMessage = parsedTextBlocks.join('\n\n');
  const hasContent = parsedTextBlocks.length > 0;

  const markdownOverrides: MarkdownToJSX.Options = {
    renderRule(next, node, renderChildren, state) {
      if (node.type === RuleType.codeInline) {
        return `\`${node.text}\``;
      }

      if (node.type === RuleType.codeBlock) {
        return (
          <CodeBlock key={state.key} language={node.lang || ''}>
            {node.text}
          </CodeBlock>
        );
      }

      return next();
    },
    overrides: {
      think: {
        component: ThinkTagProcessor,
        props: {
          thinkingEnded: thinkingEnded,
        },
      },
      citation: {
        component: Citation,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="w-full pt-8 break-words">
        <h2 className="text-black dark:text-white font-medium text-3xl lg:w-9/12">
          {message.query}
        </h2>
      </div>

      <div className="flex flex-col space-y-9 lg:space-y-0 lg:flex-row lg:justify-between lg:space-x-9">
        <div className="flex flex-col space-y-6 w-full lg:w-9/12">
          {sources.length > 0 && (
            <div className="flex flex-col space-y-2">
              <div className="flex flex-row items-center space-x-2">
                <BookCopy className="text-black dark:text-white" size={20} />
                <h3 className="text-black dark:text-white font-medium text-xl">
                  Sources
                </h3>
              </div>
              <MessageSources sources={sources} />
            </div>
          )}

          <div className="flex flex-col space-y-2">
            {sources.length > 0 && (
              <div className="flex flex-row items-center space-x-2">
                <Disc3 className="text-black dark:text-white" size={20} />
                <h3 className="text-black dark:text-white font-medium text-xl">
                  Answer
                </h3>
              </div>
            )}

            {hasContent && (
              <Markdown
                className={cn(
                  'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-6 prose-h2:font-[800] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:font-[600] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400]',
                  'max-w-none break-words text-black dark:text-white',
                )}
                options={markdownOverrides}
              >
                {parsedMessage}
              </Markdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SharedChatPage = () => {
  const params = useParams<{ shareId: string }>();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        const res = await fetch(`/api/share/${params.shareId}`);

        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setChat(data.chat);
        setMessages(data.messages);
      } catch (err) {
        console.error('Error fetching shared chat:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedChat();
  }, [params.shareId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <Loader />
      </div>
    );
  }

  if (notFound) {
    return <NextError statusCode={404} />;
  }

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 pt-8 pb-4 border-b border-light-200 dark:border-dark-200">
          <Share2 className="text-black/70 dark:text-white/70" size={20} />
          <span className="text-sm text-black/70 dark:text-white/70">
            Shared Chat
          </span>
        </div>

        {chat && (
          <div className="py-4 border-b border-light-200 dark:border-dark-200">
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              {chat.title}
            </h1>
            <p className="text-sm text-black/50 dark:text-white/50 mt-1">
              {new Date(chat.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="flex flex-col space-y-6 pt-4 pb-20">
          {messages.map((message, index) => (
            <div key={message.messageId}>
              <SharedMessageBox message={message} />
              {index !== messages.length - 1 && (
                <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary mt-6" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SharedChatPage;

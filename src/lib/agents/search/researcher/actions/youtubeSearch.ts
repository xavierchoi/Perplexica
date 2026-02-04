import z from 'zod';
import { ResearchAction } from '../../types';
import { Chunk, SearchResultsResearchBlock } from '@/lib/types';
import { searchSearxng } from '@/lib/searxng';

const schema = z.object({
  type: z.literal('youtube_search'),
  queries: z.array(z.string()).describe('List of YouTube search queries'),
});

const youtubeSearchDescription = `
Use this tool to search for YouTube videos related to the user's query. This is useful when the user is looking for video content, tutorials, reviews, demonstrations, or any visual/audio content that would be best served by YouTube.

You can provide up to 3 queries at a time. Make sure the queries are specific and relevant to the user's needs.

For example, if the user wants to learn how to cook pasta:
1. "how to cook pasta tutorial"
2. "pasta cooking tips"
3. "best pasta recipes"

If the user is looking for product reviews:
1. "iPhone 16 review"
2. "iPhone 16 hands-on"
3. "iPhone 16 vs Samsung comparison"

If this tool is present and no other tools are more relevant, you MUST use this tool to get the needed YouTube video information.
`;

const youtubeSearchAction: ResearchAction<typeof schema> = {
  name: 'youtube_search',
  schema: schema,
  getDescription: () => youtubeSearchDescription,
  getToolDescription: () =>
    "Use this tool to search for YouTube videos related to the user's query. Provide a list of concise search queries that will help find relevant video content, tutorials, reviews, or demonstrations.",
  enabled: (config) =>
    config.sources.includes('youtube') &&
    config.classification.classification.skipSearch === false &&
    config.classification.classification.youtubeSearch === true,
  execute: async (input, additionalConfig) => {
    input.queries = input.queries.slice(0, 3);

    const researchBlock = additionalConfig.session.getBlock(
      additionalConfig.researchBlockId,
    );

    if (researchBlock && researchBlock.type === 'research') {
      researchBlock.data.subSteps.push({
        type: 'searching',
        id: crypto.randomUUID(),
        searching: input.queries,
      });

      additionalConfig.session.updateBlock(additionalConfig.researchBlockId, [
        {
          op: 'replace',
          path: '/data/subSteps',
          value: researchBlock.data.subSteps,
        },
      ]);
    }

    const searchResultsBlockId = crypto.randomUUID();
    let searchResultsEmitted = false;

    let results: Chunk[] = [];

    const search = async (q: string) => {
      try {
        const res = await searchSearxng(q, {
          engines: ['youtube'],
        });

        const resultChunks: Chunk[] = res.results.map((r) => ({
          content: r.content || r.title,
          metadata: {
            title: r.title,
            url: r.url,
            thumbnail: r.thumbnail_src || r.thumbnail || r.img_src,
          },
        }));

        results.push(...resultChunks);

        if (
          !searchResultsEmitted &&
          researchBlock &&
          researchBlock.type === 'research'
        ) {
          searchResultsEmitted = true;

          researchBlock.data.subSteps.push({
            id: searchResultsBlockId,
            type: 'search_results',
            reading: resultChunks,
          });

          additionalConfig.session.updateBlock(
            additionalConfig.researchBlockId,
            [
              {
                op: 'replace',
                path: '/data/subSteps',
                value: researchBlock.data.subSteps,
              },
            ],
          );
        } else if (
          searchResultsEmitted &&
          researchBlock &&
          researchBlock.type === 'research'
        ) {
          const subStepIndex = researchBlock.data.subSteps.findIndex(
            (step) => step.id === searchResultsBlockId,
          );

          const subStep = researchBlock.data.subSteps[
            subStepIndex
          ] as SearchResultsResearchBlock;

          subStep.reading.push(...resultChunks);

          additionalConfig.session.updateBlock(
            additionalConfig.researchBlockId,
            [
              {
                op: 'replace',
                path: '/data/subSteps',
                value: researchBlock.data.subSteps,
              },
            ],
          );
        }
      } catch (err) {
        console.error(`YouTube search failed for query: ${q}`, err);
      }
    };

    await Promise.all(input.queries.map(search));

    return {
      type: 'search_results',
      results,
    };
  },
};

export default youtubeSearchAction;

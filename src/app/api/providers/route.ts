import ModelRegistry from '@/lib/models/registry';
import configManager from '@/lib/config';
import { NextRequest } from 'next/server';

export const GET = async () => {
  try {
    const registry = new ModelRegistry();

    const activeProviders = await registry.getActiveProviders();

    const filteredProviders = activeProviders.filter((p) => {
      return !p.chatModels.some((m) => m.key === 'error');
    });

    // Get selected models from server config
    const config = configManager.getCurrentConfig();
    const selectedChatModel = config.preferences.selectedChatModel;
    const selectedEmbeddingModel = config.preferences.selectedEmbeddingModel;

    return Response.json(
      {
        providers: filteredProviders,
        selectedChatModel,
        selectedEmbeddingModel,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error('An error occurred while fetching providers', err);
    return Response.json(
      {
        message: 'An error has occurred.',
      },
      {
        status: 500,
      },
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { type, name, config } = body;

    if (!type || !name || !config) {
      return Response.json(
        {
          message: 'Missing required fields.',
        },
        {
          status: 400,
        },
      );
    }

    const registry = new ModelRegistry();

    const newProvider = await registry.addProvider(type, name, config);

    return Response.json(
      {
        provider: newProvider,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error('An error occurred while creating provider', err);
    return Response.json(
      {
        message: 'An error has occurred.',
      },
      {
        status: 500,
      },
    );
  }
};

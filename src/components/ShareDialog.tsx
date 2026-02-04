'use client';

import { Share2, Link2, Check, Loader2 } from 'lucide-react';
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';

const ShareDialog = ({ chatId }: { chatId: string }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chats/${chatId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status !== 200) {
        throw new Error('Failed to create share link');
      }

      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setShareUrl(fullUrl);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleRemoveShare = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chats/${chatId}/share`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status !== 200) {
        throw new Error('Failed to remove share link');
      }

      setShareUrl(null);
      toast.success('Share link removed');
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = () => {
    setDialogOpen(true);
    handleShare();
  };

  return (
    <>
      <button
        onClick={openDialog}
        className="bg-transparent text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:scale-105 transition duration-200"
        title="Share chat"
      >
        <Share2 size={17} />
      </button>
      <Transition appear show={dialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            if (!loading) {
              setDialogOpen(false);
            }
          }}
        >
          <DialogBackdrop className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 scale-200"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform rounded-2xl bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 p-6 text-left align-middle shadow-xl transition-all">
                  <DialogTitle className="text-lg font-medium leading-6 dark:text-white flex items-center gap-2">
                    <Share2 size={20} />
                    Share Chat
                  </DialogTitle>
                  <Description className="text-sm dark:text-white/70 text-black/70 mt-2">
                    Anyone with the link can view this chat.
                  </Description>

                  <div className="mt-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-black/50 dark:text-white/50" />
                      </div>
                    ) : shareUrl ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200">
                          <Link2
                            size={16}
                            className="text-black/50 dark:text-white/50 flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 bg-transparent text-sm text-black dark:text-white outline-none truncate"
                          />
                          <button
                            onClick={handleCopy}
                            className="flex-shrink-0 p-1.5 rounded-md hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors"
                          >
                            {copied ? (
                              <Check
                                size={16}
                                className="text-green-500"
                              />
                            ) : (
                              <Link2
                                size={16}
                                className="text-black/70 dark:text-white/70"
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-row items-end justify-end space-x-4 mt-6">
                    {shareUrl && (
                      <button
                        onClick={handleRemoveShare}
                        disabled={loading}
                        className="text-red-400 text-sm hover:text-red-500 transition duration-200 disabled:opacity-50"
                      >
                        Remove Link
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!loading) {
                          setDialogOpen(false);
                        }
                      }}
                      className="text-black/50 dark:text-white/50 text-sm hover:text-black/70 hover:dark:text-white/70 transition duration-200"
                    >
                      Close
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default ShareDialog;

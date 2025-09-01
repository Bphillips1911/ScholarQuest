import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedUI } from '@/components/ui/advanced-ui-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

interface StickerCollection {
  id: string;
  name: string;
  description: string;
  theme: string;
  totalStickers: number;
  difficulty: string;
  isActive: boolean;
  collectedCount: number;
  completionPercentage: number;
  stickers: Sticker[];
}

interface Sticker {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isCollected: boolean;
  collectedAt?: string;
  isNew?: boolean;
  points: number;
  isAnimated: boolean;
  unlockMessage?: string;
}

interface StickerCollectorProps {
  studentId: string;
  className?: string;
}

const rarityColors = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#f59e0b',
  legendary: '#ef4444'
};

const rarityNames = {
  common: 'Common',
  uncommon: 'Uncommon', 
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
};

export function StickerCollector({ studentId, className }: StickerCollectorProps) {
  const { showEmojiNotification, announce, enableMicroInteractions } = useAdvancedUI();
  const queryClient = useQueryClient();
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newStickerAnimation, setNewStickerAnimation] = useState<string | null>(null);

  // Fetch student's sticker collections
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/student/stickers/collections', studentId],
    enabled: !!studentId,
  });

  // Fetch recent stickers (for notifications)
  const { data: recentStickers = [] } = useQuery({
    queryKey: ['/api/student/stickers/recent', studentId],
    enabled: !!studentId,
  });

  // Set default selected collection
  useEffect(() => {
    if (collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections[0].id);
    }
  }, [collections, selectedCollection]);

  // Show new sticker animations
  useEffect(() => {
    if (recentStickers.length > 0) {
      const newSticker = recentStickers.find(s => s.isNew);
      if (newSticker) {
        setNewStickerAnimation(newSticker.id);
        showEmojiNotification('achievement', 'sticker_collected', `New sticker collected: ${newSticker.name}!`);
        announce(`You collected a new ${newSticker.rarity} sticker: ${newSticker.name}`);
      }
    }
  }, [recentStickers, showEmojiNotification, announce]);

  const selectedCollectionData = collections.find(c => c.id === selectedCollection);

  const StickerCard = ({ sticker, collectionTheme }: { sticker: Sticker; collectionTheme: string }) => (
    <motion.div
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
        sticker.isCollected 
          ? 'bg-white shadow-lg hover:shadow-xl' 
          : 'bg-gray-100 opacity-50 grayscale'
      }`}
      style={{
        borderColor: sticker.isCollected ? rarityColors[sticker.rarity] : '#d1d5db',
        boxShadow: sticker.isCollected ? `0 0 20px ${rarityColors[sticker.rarity]}30` : 'none'
      }}
      whileHover={enableMicroInteractions && sticker.isCollected ? { 
        scale: 1.05,
        y: -5
      } : {}}
      animate={sticker.isAnimated && sticker.isCollected ? {
        rotate: [0, 5, -5, 0],
        scale: [1, 1.05, 1]
      } : {}}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      onClick={() => {
        if (sticker.isCollected) {
          showEmojiNotification('sticker', collectionTheme, `${sticker.name}: ${sticker.description}`);
          announce(`${sticker.name} sticker details: ${sticker.description}`);
        }
      }}
      data-testid={`sticker-${sticker.id}`}
    >
      {/* New badge */}
      {sticker.isNew && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          NEW!
        </motion.div>
      )}

      {/* Rarity indicator */}
      <div 
        className="absolute top-2 left-2 w-3 h-3 rounded-full"
        style={{ backgroundColor: rarityColors[sticker.rarity] }}
        title={`${rarityNames[sticker.rarity]} Rarity`}
      />

      {/* Sticker emoji */}
      <div className="text-center mb-3">
        <motion.div 
          className="text-4xl mb-2"
          animate={sticker.isCollected && newStickerAnimation === sticker.id ? {
            scale: [1, 1.3, 1],
            rotate: [0, 360, 0]
          } : {}}
          transition={{ duration: 1 }}
        >
          {sticker.emoji}
        </motion.div>
        
        <h4 className={`font-semibold text-sm ${sticker.isCollected ? 'text-gray-800' : 'text-gray-400'}`}>
          {sticker.name}
        </h4>
        
        <p className={`text-xs mt-1 ${sticker.isCollected ? 'text-gray-600' : 'text-gray-400'}`}>
          {sticker.description}
        </p>
      </div>

      {/* Collection info */}
      <div className="flex justify-between items-center mt-2">
        <Badge 
          variant="secondary" 
          className="text-xs"
          style={{ 
            backgroundColor: `${rarityColors[sticker.rarity]}20`,
            color: rarityColors[sticker.rarity]
          }}
        >
          {rarityNames[sticker.rarity]}
        </Badge>
        
        {sticker.isCollected && (
          <div className="text-xs text-green-600 font-semibold">
            +{sticker.points} pts
          </div>
        )}
      </div>

      {/* Collected date */}
      {sticker.isCollected && sticker.collectedAt && (
        <p className="text-xs text-gray-500 mt-2">
          Collected {new Date(sticker.collectedAt).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );

  const CollectionOverview = ({ collection }: { collection: StickerCollection }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{collection.name}</span>
              <Badge variant="outline">{collection.theme}</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
          </div>
          <Badge 
            variant={collection.difficulty === 'beginner' ? 'default' : 
                    collection.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
          >
            {collection.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{collection.collectedCount}/{collection.totalStickers} collected</span>
            </div>
            <Progress value={collection.completionPercentage} className="h-3" />
          </div>
          
          {collection.completionPercentage === 100 && (
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-3 rounded-lg text-center font-semibold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🏆 Collection Complete! 🏆
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 Sticker Collection
        </h2>
        <p className="text-gray-600">
          Collect stickers by earning achievements, completing challenges, and showing great character!
        </p>
      </div>

      {/* Collection Tabs */}
      {collections.length > 0 ? (
        <Tabs value={selectedCollection} onValueChange={setSelectedCollection}>
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 mb-6">
            {collections.map((collection) => (
              <TabsTrigger key={collection.id} value={collection.id} className="text-sm">
                {collection.name}
                <Badge variant="secondary" className="ml-2">
                  {collection.collectedCount}/{collection.totalStickers}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {collections.map((collection) => (
            <TabsContent key={collection.id} value={collection.id}>
              <CollectionOverview collection={collection} />
              
              {/* Stickers Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <AnimatePresence>
                  {collection.stickers.map((sticker, index) => (
                    <motion.div
                      key={sticker.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <StickerCard 
                        sticker={sticker} 
                        collectionTheme={collection.theme}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Collection Stats */}
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {collection.stickers.filter(s => s.rarity === 'common' && s.isCollected).length}
                      </div>
                      <div className="text-sm text-gray-600">Common</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {collection.stickers.filter(s => s.rarity === 'rare' && s.isCollected).length}
                      </div>
                      <div className="text-sm text-gray-600">Rare</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {collection.stickers.filter(s => s.rarity === 'epic' && s.isCollected).length}
                      </div>
                      <div className="text-sm text-gray-600">Epic</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {collection.stickers.filter(s => s.rarity === 'legendary' && s.isCollected).length}
                      </div>
                      <div className="text-sm text-gray-600">Legendary</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-semibold mb-2">No Collections Yet</h3>
            <p className="text-gray-600">
              Start earning points and completing challenges to unlock your first sticker collection!
            </p>
          </CardContent>
        </Card>
      )}

      {/* New Sticker Animation Overlay */}
      <AnimatePresence>
        {newStickerAnimation && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNewStickerAnimation(null)}
          >
            <motion.div
              className="bg-white p-8 rounded-xl text-center max-w-sm mx-4"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 50 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1 }}
              >
                🎉
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                New Sticker Collected!
              </h3>
              <p className="text-gray-600 mb-4">
                You've earned a new sticker for your collection!
              </p>
              <Button onClick={() => setNewStickerAnimation(null)}>
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
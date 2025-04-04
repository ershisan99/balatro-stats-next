'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type React from 'react'
import { useState } from 'react'

import { GamesTable } from '@/app/players/[id]/_components/games-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { RANKED_CHANNEL, VANILLA_CHANNEL } from '@/shared/constants'
import { api } from '@/trpc/react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  IceCreamCone,
  InfoIcon,
  MinusCircle,
  ShieldHalf,
  Star,
  Trophy,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { isNonNullish } from 'remeda'

const numberFormatter = new Intl.NumberFormat('en-US', {
  signDisplay: 'exceptZero',
})
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
})

export function UserInfo() {
  const [filter, setFilter] = useState('all')
  const [leaderboardFilter, setLeaderboardFilter] = useState('all')
  const { id } = useParams()
  if (!id || typeof id !== 'string') return null

  // Fetch games data unconditionally
  const gamesQuery = api.history.user_games.useSuspenseQuery({ user_id: id })
  const games = gamesQuery[0] || [] // Ensure games is always an array

  const [discord_user] = api.discord.get_user_by_id.useSuspenseQuery({
    user_id: id,
  })

  // Mock data for the two leaderboards - replace with actual API calls
  const [rankedLeaderboard] = api.leaderboard.get_leaderboard.useSuspenseQuery({
    channel_id: RANKED_CHANNEL,
  })
  const [vanillaLeaderboard] = api.leaderboard.get_leaderboard.useSuspenseQuery(
    {
      channel_id: VANILLA_CHANNEL,
    }
  )
  const [vanillaUserRank] = api.leaderboard.get_user_rank.useSuspenseQuery({
    channel_id: VANILLA_CHANNEL,
    user_id: id,
  })
  const [rankedUserRank] = api.leaderboard.get_user_rank.useSuspenseQuery({
    channel_id: RANKED_CHANNEL,
    user_id: id,
  })
  console.log({ vanillaUserRank, rankedUserRank })

  // Filter games by leaderboard if needed
  const filteredGamesByLeaderboard =
    leaderboardFilter === 'all'
      ? games
      : games.filter((game) => game.gameType === leaderboardFilter)

  // Filter by result
  const filteredGames =
    filter === 'all'
      ? filteredGamesByLeaderboard
      : filter === 'wins'
        ? filteredGamesByLeaderboard.filter((game) => game.result === 'win')
        : filter === 'losses'
          ? filteredGamesByLeaderboard.filter((game) => game.result === 'loss')
          : filteredGamesByLeaderboard.filter((game) => game.result === 'tie')

  const games_played = games.length
  let wins = 0
  let losses = 0
  let ties = 0
  for (const game of games) {
    if (game.result === 'win') {
      wins++
    } else if (game.result === 'loss') {
      losses++
    } else if (game.result === 'tie') {
      ties++
    }
  }

  const aliases = [...new Set(games.map((g) => g.playerName))]
  const lastGame = games.at(0)

  const currentName = lastGame?.playerName ?? discord_user.username
  const profileData = {
    username: currentName,
    avatar: discord_user.avatar_url,
    games: games_played,
    wins,
    losses,
    ties,
    winRate: games_played > 0 ? Math.round((wins / games_played) * 100) : 0,
  }

  const firstGame = games.at(-1)

  // Get last games for each leaderboard
  const lastRankedGame = games
    .filter((game) => game.gameType === 'ranked')
    .at(0)
  const lastVanillaGame = games
    .filter((game) => game.gameType.toLowerCase() === 'vanilla')
    .at(0)

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950'>
      <div className='container mx-auto'>
        <Card className='overflow-hidden border-none bg-white py-0 shadow-lg dark:bg-zinc-900'>
          <CardHeader className='border-gray-200 border-b bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900'>
            <div className='flex flex-col items-center gap-6 md:flex-row'>
              <div className='relative'>
                <Avatar className='h-24 w-24 border-4 border-gray-100 shadow-md dark:border-zinc-800'>
                  <AvatarImage
                    src={profileData.avatar}
                    alt={profileData.username}
                  />
                  <AvatarFallback className='bg-violet-50 font-bold text-2xl text-violet-600 dark:bg-violet-900/30 dark:text-violet-300'>
                    {profileData.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className='text-center md:text-left'>
                <div className={'flex items-start gap-2'}>
                  <h1 className='font-bold text-3xl text-gray-900 dark:text-white'>
                    {profileData.username}
                  </h1>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className={'size-4'} />
                      </TooltipTrigger>
                      <TooltipContent align={'center'} sideOffset={5}>
                        <div>
                          <p>Also known as:</p>
                          <ul className={'list-disc pl-4'}>
                            {aliases.map((alias) => (
                              <li key={alias}>{alias}</li>
                            ))}
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <p className='text-gray-500 text-sm dark:text-zinc-400'>
                  {firstGame ? (
                    <>First game: {dateFormatter.format(firstGame.gameTime)}</>
                  ) : (
                    <>No games played yet</>
                  )}
                </p>
                <div className='mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-start'>
                  {!!rankedLeaderboard && (
                    <Badge
                      variant='outline'
                      className='border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800'
                    >
                      <Trophy className='mr-1 h-3 w-3 text-violet-500' />
                      <span className='text-gray-700 dark:text-zinc-300'>
                        Ranked Queue:{' '}
                        {isNonNullish(rankedUserRank?.rank)
                          ? `#${rankedUserRank.rank}`
                          : 'N/A'}
                      </span>
                    </Badge>
                  )}
                  {!!vanillaLeaderboard && (
                    <Badge
                      variant='outline'
                      className='border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800'
                    >
                      <Trophy className='mr-1 h-3 w-3 text-violet-500' />
                      <span className='text-gray-700 dark:text-zinc-300'>
                        Vanilla Queue:{' '}
                        {isNonNullish(vanillaUserRank?.rank)
                          ? `#${vanillaUserRank.rank}`
                          : 'N/A'}
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'grid w-full flex-grow grid-cols-2 divide-gray-100 md:w-auto md:grid-cols-3 md:divide-y-0 dark:divide-zinc-800',
                  isNonNullish(rankedUserRank?.mmr) && 'lg:grid-cols-5',
                  isNonNullish(vanillaUserRank?.mmr) && 'lg:grid-cols-5',
                  isNonNullish(rankedUserRank?.mmr) &&
                    isNonNullish(vanillaUserRank?.mmr) &&
                    'lg:grid-cols-6'
                )}
              >
                <StatsCard
                  title='Games'
                  value={profileData.games}
                  icon={<BarChart3 className='h-5 w-5 text-violet-500' />}
                  description='Total matches'
                />
                <StatsCard
                  title='Wins'
                  value={profileData.wins}
                  icon={<ArrowUpCircle className='h-5 w-5 text-emerald-500' />}
                  description={`${profileData.winRate}% win rate`}
                  accentColor='text-emerald-500'
                />
                <StatsCard
                  title='Losses'
                  value={profileData.losses}
                  icon={<ArrowDownCircle className='h-5 w-5 text-rose-500' />}
                  description={`${profileData.games > 0 ? Math.round((profileData.losses / profileData.games) * 100) : 0}% loss rate`}
                  accentColor='text-rose-500'
                />
                <StatsCard
                  title='Ties'
                  value={profileData.ties}
                  icon={<MinusCircle className='h-5 w-5 text-amber-500' />}
                  description={`${profileData.games > 0 ? Math.round((profileData.ties / profileData.games) * 100) : 0}% tie rate`}
                  accentColor='text-amber-500'
                />
                {isNonNullish(rankedUserRank?.mmr) && (
                  <StatsCard
                    title='Ranked MMR'
                    value={Math.round(rankedUserRank.mmr)}
                    description={
                      lastRankedGame ? (
                        <span
                          className={cn(
                            'flex items-center',
                            lastRankedGame.mmrChange > 0
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                          )}
                        >
                          {lastRankedGame.mmrChange > 0 ? (
                            <ChevronUp className='h-3 w-3' />
                          ) : (
                            <ChevronDown className='h-3 w-3' />
                          )}
                          {numberFormatter.format(
                            Math.trunc(lastRankedGame.mmrChange)
                          )}{' '}
                          last match
                        </span>
                      ) : null
                    }
                    icon={
                      <ShieldHalf className='h-5 w-5 text-zink-800 dark:text-zink-200' />
                    }
                    accentColor='text-zink-800 dark:text-zink-200'
                  />
                )}
                {isNonNullish(vanillaUserRank?.mmr) && (
                  <StatsCard
                    title='Vanilla MMR'
                    value={Math.round(vanillaUserRank.mmr)}
                    icon={
                      <IceCreamCone className='h-5 w-5 text-zink-800 dark:text-zink-200' />
                    }
                    accentColor='text-zink-800 dark:text-zink-200'
                    description={
                      lastVanillaGame ? (
                        <span
                          className={cn(
                            'flex items-center',
                            lastVanillaGame.mmrChange > 0
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                          )}
                        >
                          {lastVanillaGame.mmrChange > 0 ? (
                            <ChevronUp className='h-3 w-3' />
                          ) : (
                            <ChevronDown className='h-3 w-3' />
                          )}
                          {numberFormatter.format(
                            Math.trunc(lastVanillaGame.mmrChange)
                          )}{' '}
                          last match
                        </span>
                      ) : null
                    }
                  />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            <Tabs defaultValue='matches' className='p-6'>
              <div className='mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                <TabsList className='bg-gray-100 dark:bg-zinc-800'>
                  <TabsTrigger value='matches'>Match History</TabsTrigger>
                  <TabsTrigger value='stats'>Statistics</TabsTrigger>
                  <TabsTrigger value='achievements'>Achievements</TabsTrigger>
                </TabsList>

                <div className='flex items-center gap-2'>
                  <div className='mr-2 flex items-center gap-2'>
                    <Trophy className='h-4 w-4 text-gray-400 dark:text-zinc-400' />
                    <Select
                      value={leaderboardFilter}
                      onValueChange={setLeaderboardFilter}
                    >
                      <SelectTrigger className='h-9 w-[150px]'>
                        <SelectValue placeholder='Leaderboard' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Leaderboards</SelectItem>
                        <SelectItem value='ranked'>Ranked</SelectItem>
                        <SelectItem value='vanilla'>Vanilla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Filter className='h-4 w-4 text-gray-400 dark:text-zinc-400' />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className='h-9 w-[120px]'>
                      <SelectValue placeholder='Filter' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Games</SelectItem>
                      <SelectItem value='wins'>Wins</SelectItem>
                      <SelectItem value='losses'>Losses</SelectItem>
                      <SelectItem value='ties'>Ties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value='matches' className='m-0'>
                <div className='overflow-hidden rounded-lg border'>
                  <div className='overflow-x-auto'>
                    <GamesTable games={games} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='stats' className='m-0'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  {(rankedLeaderboard || lastRankedGame) && (
                    <LeaderboardStatsCard
                      title='Ranked Queue Stats'
                      rank={rankedUserRank?.rank}
                      mmr={
                        lastRankedGame
                          ? Math.trunc(
                              lastRankedGame.playerMmr +
                                lastRankedGame.mmrChange
                            )
                          : undefined
                      }
                      icon={<Trophy className='h-5 w-5 text-violet-500' />}
                      accentColor='text-violet-500'
                    />
                  )}

                  {(vanillaLeaderboard || lastVanillaGame) && (
                    <LeaderboardStatsCard
                      title='Vanilla Queue Stats'
                      rank={vanillaUserRank?.rank}
                      mmr={
                        lastVanillaGame
                          ? Math.trunc(
                              lastVanillaGame.playerMmr +
                                lastVanillaGame.mmrChange
                            )
                          : undefined
                      }
                      icon={<Star className='h-5 w-5 text-amber-500' />}
                      accentColor='text-amber-500'
                    />
                  )}

                  {!rankedLeaderboard &&
                    !vanillaLeaderboard &&
                    !lastRankedGame &&
                    !lastVanillaGame && (
                      <div className='col-span-2 flex h-40 items-center justify-center rounded-lg border bg-gray-50 dark:bg-zinc-800/50'>
                        <p className='text-gray-500 dark:text-zinc-400'>
                          No leaderboard data available
                        </p>
                      </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent value='achievements' className='m-0'>
                <div className='flex h-40 items-center justify-center rounded-lg border bg-gray-50 dark:bg-zinc-800/50'>
                  <p className='text-gray-500 dark:text-zinc-400'>
                    Achievements coming soon
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description: React.ReactNode
  accentColor?: string
}

function StatsCard({
  title,
  value,
  icon,
  description,
  accentColor = 'text-violet-500',
}: StatsCardProps) {
  return (
    <div className='flex w-fit flex-col items-start justify-self-center p-2 text-center md:justify-self-auto'>
      <h3 className='mb-1 text-nowrap font-medium text-gray-500 text-sm dark:text-zinc-400'>
        {title}
      </h3>
      <div className={'flex items-center gap-2'}>
        <div className='flex items-center justify-center'>{icon}</div>
        <p className={cn('font-bold text-3xl', accentColor)}>{value}</p>
      </div>
      <p className='mt-1 text-gray-500 text-xs dark:text-zinc-400'>
        {description}
      </p>
    </div>
  )
}

interface LeaderboardStatsCardProps {
  title: string
  rank?: number
  mmr?: number
  icon: React.ReactNode
  accentColor?: string
}

function LeaderboardStatsCard({
  title,
  rank,
  mmr,
  icon,
  accentColor = 'text-violet-500',
}: LeaderboardStatsCardProps) {
  return (
    <div className='rounded-lg border bg-white p-6 dark:bg-zinc-800/20'>
      <div className='mb-4 flex items-center gap-3'>
        <div
          className={cn(
            'rounded-full bg-gray-100 p-2 dark:bg-zinc-800',
            accentColor
          )}
        >
          {icon}
        </div>
        <h3 className='font-semibold text-lg'>{title}</h3>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        {rank !== undefined && (
          <div className='rounded-lg bg-gray-50 p-4 dark:bg-zinc-800/40'>
            <p className='text-gray-500 text-sm dark:text-zinc-400'>Rank</p>
            <p className={cn('mt-1 font-bold text-2xl', accentColor)}>
              #{rank}
            </p>
          </div>
        )}

        {mmr !== undefined && (
          <div className='rounded-lg bg-gray-50 p-4 dark:bg-zinc-800/40'>
            <p className='text-gray-500 text-sm dark:text-zinc-400'>MMR</p>
            <p className={cn('mt-1 font-bold text-2xl', accentColor)}>{mmr}</p>
          </div>
        )}

        {rank === undefined && mmr === undefined && (
          <div className='col-span-2 flex h-20 items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-zinc-800/40'>
            <p className='text-gray-500 dark:text-zinc-400'>
              No data available
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

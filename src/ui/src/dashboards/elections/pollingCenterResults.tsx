import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import React, { useEffect, useState } from 'react';

import { Item } from '@radix-ui/react-select';
import { Presentation } from 'lucide-react';
import { TLevelTabs } from './types';
import { useUser } from '../../App';

export type TLevelDjango =
  | 'president'
  | 'governor'
  | 'senator'
  | 'mp'
  | 'women_rep'
  | 'mca';

const levelsArray: TLevelDjango[] = [
  'president',
  'governor',
  'senator',
  'mp',
  'women_rep',
  'mca'
];

export interface IPollingCenterResultsProcessed {
  fullName: string;
  party: string;
  party_color: string;
  totalVotes: number;
  countedStreams: number;
  percentage: number;
}

export interface IAggregatedResults {
  totalStreams: number;
  candidates: IPollingCenterResultsProcessed[];
  totalVotes: number;
}

export interface ICandidateDetails {
  id: number;
  first_name: string;
  last_name: string;
  surname: null | string;
  party: string;
  party_color: string;
  level: TLevelDjango;
  passport_photo: null | string;
  county: null;
  constituency: null;
  ward: null;
  is_verified: boolean;
  verified_by_party: boolean;
}

export interface IPollingCenterCandidateResults {
  polling_station: {
    code: string;
    stream_number: number;
    registered_voters: number;
    date_created: string;
    date_modified: string;
    is_verified: boolean;
  };
  presidential_candidate: ICandidateDetails | null;
  governor_candidate: ICandidateDetails | null;
  votes: number;
  is_verified: boolean;
}

export interface IPollingCenterResultsProcessed {
  fullName: string;
  party: string;
  party_color: string;
  totalVotes: number;
  countedStreams: number;
  percentage: number;
}

// Parse and aggregate candidate results across all streams
function aggregateCandidateResults(
  data: IPollingCenterCandidateResults[],
  level: TLevelDjango
): IAggregatedResults {
  // Map to hold aggregation per candidate id
  const candidateMap: Record<
    number,
    {
      fullName: string;
      party: string;
      party_color: string;
      totalVotes: number;
      countedStreams: number;
    }
  > = {};

  // Find total streams (unique polling_station.code + stream_number)
  const uniqueStreams = new Set(
    data.map(
      (item: IPollingCenterCandidateResults) =>
        `${item.polling_station.code}-${item.polling_station.stream_number}`
    )
  );
  const totalStreams = uniqueStreams.size;

  data.forEach((item: IPollingCenterCandidateResults) => {
    let candidate: ICandidateDetails | null = null;
    if (level === 'president' && item.presidential_candidate) {
      candidate = item['presidential_candidate'];
    } else if (level === 'governor' && item.governor_candidate) {
      candidate = item['governor_candidate'];
    }

    if (!candidate) {
      return; // Skip if candidate is not found for this item
    }

    const candidateId = candidate.id;
    const fullName = [
      candidate.first_name,
      candidate.last_name,
      candidate.surname
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!candidateMap[candidateId]) {
      candidateMap[candidateId] = {
        fullName,
        party: candidate.party,
        party_color: candidate.party_color,
        totalVotes: 0,
        countedStreams: 0
      };
    }

    candidateMap[candidateId].totalVotes += item.votes;
    candidateMap[candidateId].countedStreams += 1;
  });

  // Calculate total votes for percentage
  const totalVotes = Object.values(candidateMap).reduce(
    (sum, c) => sum + c.totalVotes,
    0
  );

  // Sort candidates by totalVotes descending
  const sortedCandidates: IPollingCenterResultsProcessed[] = Object.values(
    candidateMap
  )
    .map((c) => ({
      ...c,
      percentage: totalVotes > 0 ? (c.totalVotes / totalVotes) * 100 : 0
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes);

  // Return as array, including totalStreams for reference and percentage for each candidate

  return {
    totalStreams,
    candidates: sortedCandidates,
    totalVotes
  };
}

function PollingCenterResults() {
  const [activeTab, setActiveTab] = useState<TLevelDjango>('president');

  const [presResults, setPresResults] = useState<
    IPollingCenterCandidateResults[] | null
  >(null);

  const [presResultsProcessed, setPresResultsProcessed] = useState<
    IPollingCenterResultsProcessed[] | null
  >(null);

  const [streamsNumber, setStreamsNumber] = useState<number>(0);
  const [totalPresVotes, setTotalPresVotes] = useState<number>(0);

  const [governorResults, setGovernorResults] = useState<
    IPollingCenterCandidateResults[] | null
  >(null);
  const [totalGovernorVotes, setTotalGovernorVotes] = useState<number>(0);
  const [govResultsProcessed, setGovResultsProcessed] = useState<
    IPollingCenterResultsProcessed[] | null
  >(null);

  const {
    djangoUserPollingCenterCode,
    djangoUserPollingCenterName,
    djangoUserWardNumber,
    djangoUserConstName,
    djangoUserCountyName,
    djangoUserWardName
  } = useUser();

  useEffect(() => {
    console.log('useEffect to call data');

    if (presResults === null && activeTab === 'president') {
      fetch(
        `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/presidential/`,
        {
          method: 'GET'
        }
      )
        .then((res) => res.json())
        .then((data) => {
          // console.log(data, "data");

          if (data.length > 0) {
            setPresResults(data['data']);
            setStreamsNumber(data['totalStreams']);
          }

          let y = aggregateCandidateResults(data['data'], 'president');
          // console.log(y, 'y');

          setTotalPresVotes(y.totalVotes);
          setStreamsNumber(y.totalStreams);

          setPresResultsProcessed(y.candidates);
        });
    }

    console.log(activeTab, 'activeTab');
    console.log(governorResults, 'governor results');
    console.log(governorResults === null, 'governor results === null');
    console.log(activeTab === 'governor', "'activeTab === 'governor'");

    if (activeTab === 'governor' && governorResults === null) {
      fetch(
        `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/governor/`,
        {
          method: 'GET'
        }
      )
        .then((res) => res.json())
        .then((data) => {
          console.log(data, 'gov data');

          if (data.length > 0) {
            setGovernorResults(data['data']);
            // setStreamsNumber(data['totalStreams']);
          }

          let y = aggregateCandidateResults(data['data'], 'governor');
          console.log(y, 'y governor');

          setTotalGovernorVotes(y.totalVotes);
          // setStreamsNumber(y.totalStreams);

          setGovResultsProcessed(y.candidates);
        });
    }
  }, [activeTab]);

  // Mock data for county tabs
  const countyData = {
    president: [
      {
        name: 'Candidate 1',
        party: 'Party A',
        votes: 230450,
        percentage: 17.2,
        color: '#0015BC'
      },
      {
        name: 'Candidate 2',
        party: 'Party B',
        votes: 172340,
        percentage: 82.8,
        color: '#E9141D'
      }
    ],
    governor: [
      {
        name: 'Candidate 1',
        party: 'Party A',
        votes: 230450,
        percentage: 57.2,
        color: '#0015BC'
      },
      {
        name: 'Candidate 2',
        party: 'Party B',
        votes: 172340,
        percentage: 42.8,
        color: '#E9141D'
      }
    ],
    senator: [
      {
        name: 'Candidate 1',
        party: 'Party A',
        votes: 215670,
        percentage: 53.6,
        color: '#0015BC'
      },
      {
        name: 'Candidate 2',
        party: 'Party B',
        votes: 186590,
        percentage: 46.4,
        color: '#E9141D'
      }
    ],
    women_rep: [
      {
        name: 'Candidate 1',
        party: 'Party B',
        votes: 195230,
        percentage: 48.5,
        color: '#E9141D'
      },
      {
        name: 'Candidate 2',
        party: 'Party A',
        votes: 207340,
        percentage: 51.5,
        color: '#0015BC'
      }
    ],

    mp: [
      {
        name: 'Candidate 1',
        party: 'Party B',
        votes: 195230,
        percentage: 48.5,
        color: '#E9141D'
      },
      {
        name: 'Candidate 2',
        party: 'Party A',
        votes: 207340,
        percentage: 51.5,
        color: '#0015BC'
      }
    ],
    mca: [
      {
        name: 'Candidate 1',
        party: 'Party B',
        votes: 45230,
        percentage: 31.2,
        color: '#E9141D'
      },
      {
        name: 'Candidate 2',
        party: 'Party A',
        votes: 52170,
        percentage: 36.0,
        color: '#0015BC'
      },
      {
        name: 'Candidate 3',
        party: 'Independent',
        votes: 47620,
        percentage: 32.8,
        color: '#FFB90F'
      }
    ]
  };

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  };

  return (
    <div className='p-4 mb-6 bg-white rounded-lg shadow-md'>
      <h2 className='mb-4 text-xl font-bold text-center'>
        {djangoUserPollingCenterName ? djangoUserPollingCenterName : ''} Polling
        Center Election Results
      </h2>
      {/* Tabs */}
      <div className='flex mb-4 border-b'>
        {levelsArray.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'women_rep'
              ? 'Women Rep'
              : tab === 'mp'
              ? 'MP'
              : tab === 'mca'
              ? 'MCA'
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className='mb-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {/* Left side: List of candidates */}
          <div>
            <h3 className='mb-3 font-semibold'>Candidates</h3>

            <div className='space-y-3'>
              {activeTab === 'president' &&
              totalPresVotes > 0 &&
              presResultsProcessed !== null ? (
                presResultsProcessed.map((candidate) => (
                  <div
                    key={candidate.fullName}
                    className='flex items-center justify-between p-3 border-l-4 rounded-lg shadow-sm'
                    style={{ borderColor: candidate.party_color }}
                  >
                    <div>
                      <div className='font-medium'>{candidate.fullName}</div>
                      <div className='text-sm text-gray-600'>
                        {candidate.party}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8rem' }}>
                        {candidate.countedStreams}/{streamsNumber} streams
                      </p>
                    </div>

                    <div className='text-right'>
                      <div className='font-bold'>
                        {formatNumber(candidate.totalVotes)} votes
                      </div>
                      <div className='text-sm text-gray-600'>
                        {candidate.percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))
              ) : activeTab === 'president' ? (
                <div className='flex items-center justify-center h-full'>
                  <p className='text-center text-gray-500'>
                    No results available for this level yet.
                  </p>
                </div>
              ) : null}

              {activeTab === 'governor' &&
              totalGovernorVotes > 0 &&
              govResultsProcessed !== null ? (
                govResultsProcessed.map((candidate) => (
                  <div
                    key={candidate.fullName}
                    className='flex items-center justify-between p-3 border-l-4 rounded-lg shadow-sm'
                    style={{ borderColor: candidate.party_color }}
                  >
                    <div>
                      <div className='font-medium'>{candidate.fullName}</div>
                      <div className='text-sm text-gray-600'>
                        {candidate.party}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8rem' }}>
                        {candidate.countedStreams}/{streamsNumber} streams
                      </p>
                    </div>

                    <div className='text-right'>
                      <div className='font-bold'>
                        {formatNumber(candidate.totalVotes)} votes
                      </div>
                      <div className='text-sm text-gray-600'>
                        {candidate.percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))
              ) : activeTab === 'governor' ? (
                <div className='flex items-center justify-center h-full'>
                  <p className='text-center text-gray-500'>
                    No results available for this level yet.
                  </p>
                </div>
              ) : null}

              {activeTab !== 'president' &&
                activeTab !== 'governor' &&
                countyData[activeTab].map((candidate) => (
                  <div
                    key={candidate.name}
                    className='flex items-center justify-between p-3 border-l-4 rounded-lg shadow-sm'
                    style={{ borderColor: candidate.color }}
                  >
                    <div>
                      <div className='font-medium'>{candidate.name}</div>
                      <div className='text-sm text-gray-600'>
                        {candidate.party}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-bold'>{candidate.percentage}%</div>
                      <div className='text-sm text-gray-600'>
                        {formatNumber(candidate.votes)} votes
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Right side: Pie chart */}
          <div>
            <h3 className='mb-3 font-semibold'>Vote Distribution</h3>
            <div className='h-64'>
              {presResultsProcessed !== null || governorResults !== null ? (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={
                        activeTab === 'president'
                          ? presResultsProcessed
                          : activeTab === 'governor' && govResultsProcessed
                          ? govResultsProcessed
                          : countyData[activeTab]
                      }
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='totalVotes'
                      nameKey='fullName'
                      label={({ name, percentage }) =>
                        `${name}: ${percentage.toFixed(2)}%`
                      }
                    >
                      {presResultsProcessed.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.party_color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `${formatNumber(parseInt(value.toString()))} votes`,
                        'Votes'
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={countyData[activeTab]}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='votes'
                      nameKey='name'
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                    >
                      {countyData[activeTab].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `${formatNumber(parseInt(value.toString()))} votes`,
                        'Votes'
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PollingCenterResults;

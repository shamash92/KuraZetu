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

import { Presentation } from 'lucide-react';
import { TLevelTabs } from './types';
import { useUser } from '../../App';

function PollingCenterResults() {
  const [activeTab, setActiveTab] = useState<TLevelTabs>('president');

  const [presResults, setPresResults] = useState(null);

  const levelsArray: TLevelTabs[] = [
    'president',
    'governor',
    'senator',
    'womanRep',
    'mp',
    'mca'
  ];

  const {
    djangoUserPollingCenterCode,
    djangoUserPollingCenterName,
    djangoUserWardNumber,
    djangoUserConstName,
    djangoUserCountyName,
    djangoUserWardName
  } = useUser();

  useEffect(() => {
    console.log('useEffect to call counties');

    if (presResults === null) {
      fetch(
        `/api/results/polling-center/${djangoUserWardNumber}/${djangoUserPollingCenterCode}/presidential/`,
        {
          method: 'GET'
        }
      )
        .then((res) => res.json())
        .then((data) => {
          // console.log(data, 'data');

          let x = {
            polling_station: {
              code: '031164082007101',
              stream_number: 1,
              registered_voters: 366,
              date_created: '2025-05-11T09:46:24.661675+03:00',
              date_modified: '2025-05-11T17:52:43.483877+03:00',
              is_verified: false
            },
            presidential_candidate: {
              id: 2,
              first_name: 'pres',
              last_name: '2',
              surname: null,
              party: 2,
              party_color: '#E9141D',
              level: 'president',
              passport_photo: null,
              county: null,
              constituency: null,
              ward: null,
              is_verified: false,
              verified_by_party: false
            },
            votes: 90000,
            is_verified: false
          };

          if (data.length > 0) {
            setPresResults(data);
          }
        });
    }
  }, [presResults]);

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
    womanRep: [
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  // Format large numbers with commas
  const formatNumber = (num) => {
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
            {tab === 'womanRep'
              ? 'Woman Rep'
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
              {countyData[activeTab].map((candidate) => (
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
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {countyData[activeTab].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${formatNumber(value)} votes`,
                      'Votes'
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PollingCenterResults;

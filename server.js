const PORT = process.env.PORT || 9090
const server = require('http').createServer()
const io = require('socket.io')(server)
const CronJob = require('cron').CronJob
const axios = require('axios')

const satelliteList = [
  {
    name: 'Landsat-5',
    id: '14780',
    colorCode: '#3f0ff0'
  },
  {
    name: 'Landsat-7',
    id: '25682',
    colorCode: '#5f0ff8'
  },
  {
    name: 'Landsat-8',
    id: '39084',
    colorCode: '#9ACD32'
  },
  {
    name: 'Spot-1',
    id: '16613',
    colorCode: '#FFE4E1'
  },
  {
    name: 'Spot-2',
    id: '20436',
    colorCode: '#B8860B'
  },
  {
    name: 'Spot-4',
    id: '25260',
    colorCode: '#DA70D6'
  },
  {
    name: 'Spot-5',
    id: '27421',
    colorCode: '#DC143C'
  },
  {
    name: 'Spot-6',
    id: '38755',
    colorCode: '#0Cf43C'
  },
  {
    name: 'Theos',
    id: '33396',
    colorCode: '#6B8E23'
  },
  {
    name: 'Pleiades-1',
    id: '38012',
    colorCode: '#FFB6C1'
  },
  {
    name: 'Resourcesat-2',
    id: '37387',
    colorCode: '#ADFF2F'
  },
  {
    name: 'NPP',
    id: '37849',
    colorCode: '#FFA07A'
  },
  {
    name: 'ERS-1',
    id: '21574',
    colorCode: '#f20000'
  },
  {
    name: 'ERS-2',
    id: '23560',
    colorCode: '#520ff0'
  },
  {
    name: 'ENVISAT',
    id: '27386',
    colorCode: '#00ff00'
  },
  {
    name: 'RADARSAT-1',
    id: '23710',
    colorCode: '#0000ff'
  },
  {
    name: 'RADARSAT-2',
    id: '32382',
    colorCode: '#4169E1'
  },
  {
    name: 'SJ-9A',
    id: '38860',
    colorCode: '#a0f3ef'
  },
  {
    name: 'CBERS-1',
    id: '25940',
    colorCode: '#FF00FF'
  },
  {
    name: 'CBERS-2',
    id: '28057',
    colorCode: '#f4c542'
  },
  {
    name: 'CBERS-2B',
    id: '32062',
    colorCode: '#41ebf4'
  },
  {
    name: 'CBERS-04',
    id: '40336',
    colorCode: '#f441a0'
  },
  {
    name: 'HJ-1A',
    id: '33320',
    colorCode: '#00FFFF'
  },
  {
    name: 'HJ-1B',
    id: '33321',
    colorCode: '#f45e41'
  },
  {
    name: 'ZY-3',
    id: '38046',
    colorCode: '#FFA500'
  },
  {
    name: 'GF-1',
    id: '39150',
    colorCode: '#800080'
  },
  {
    name: 'GF-2',
    id: '40118',
    colorCode: '#62587a'
  },
  {
    name: 'GF-3',
    id: '42680',
    colorCode: '#bc3c6f'
  },
  // {
  //   name: 'GF-4',
  //   id: '41194',
  //   colorCode: '#f1f73d'
  // },
  {
    name: 'HJ-1C',
    id: '38997',
    colorCode: '#FF1493'
  }
]

const API_KEY = '8WB4S8-SWUPDN-SW6JEM-3Y0K'

console.log('☎️ Listening on port: 9090')
server.listen(PORT)

var satelliteData = []



// Initialize satellite data
getSatelliteData()

// Get satellite data every 5 minutes
new CronJob('*/1 * * * *', () => {
  getSatelliteData()
  console.log('CRONED')
}, null, true, 'America/Los_Angeles');

function getSatelliteData() {
  console.log('📡', ' Getting satellite data...')

  // Array to gather all promises to determine when done
  let apiPromiseArray = []

  // Get location data for each satellite
  satelliteList.forEach(satellite => {
    let url = 'https://www.n2yo.com/rest/v1/satellite/positions/' + satellite.id + '/41.702/-76.014/0/300/&apiKey=' + API_KEY
    let apiPromise = axios.get(url)
      .then(response => {
        console.log('🛰️', ' Received data for:', satellite.name)
        // Initilizing...
        if (satelliteData.length < satelliteList.length) {
          // Add new data 
          satelliteData.push({
            id: satellite.id,
            name: satellite.name,
            calls: response.data.info.transactionscount,
            colorCode: satellite.colorCode,
            positions: response.data.positions
          })
        } else {
          // Add positions...
          for (let i = 0; i < satelliteData.length; i++) {
            if (satelliteData[i].id === satellite.id) {
              // TEMP
              satelliteData[i].positions = response.data.positions
              // satelliteData[i].positions.push(response.data.positions)
              // // Trim array
              // console.log(satelliteData[i].positions.length)
              // if (satelliteData[i].positions.length >= 600) {
              //   console.log('truncating')
              //   satelliteData[i].positions.length = 600
              // }
              // console.log(satelliteData[i].positions.length)
              // satelliteData[i].positions = satelliteData[i].positions.slice(0, 600);
            }
          }
        }
      })
      .catch(error => console.log(error))
    apiPromiseArray.push(apiPromise)
  })

  // All data is fetched
  Promise.all(apiPromiseArray).then(() => {
    console.log('✅', 'All data received. Emiting to clients.')
    console.log('!!!', 'Calls in last hour:', satelliteData[0].calls)

    io.emit('update', satelliteData)
  })
    .catch(error => console.log(error))
}

io.sockets.on('connection', socket => {
  console.log('📲', 'Connection from', socket.id)
  io.to(socket.id).emit('update', satelliteData)
})
var opt = {
    canvasId : 'time-distance-graph',
    title : '测试用时距图',
    color:{
        background :'#212121'
    },
    phase : [
        {
            crossingName : 'monkey-road',
            disc : [ 
                { id:'p001', phaseName : 'south-east', duration : '30', pointTo : 'p007' }, 
                { id:'p002',phaseName : 'south-north', duration : '50' },
                { id:'p003',phaseName : 'south-west', duration : '40' }, 
                { id:'p004',phaseName : 'west-north', duration : '30' },
            ],
            operated : '120',
            distance : '200'
        },
        {
            crossingName : 'cat-road',
            disc : [ 
                { id:'p005', phaseName : 'south-east', duration : '50' }, 
                { id:'p006', phaseName : 'south-north', duration : '40' , pointTo : 'p002' },
                { id:'p007', phaseName : 'south-west', duration : '20' }, 
                { id:'p008', phaseName : 'west-north', duration : '40' },
            ],
            operated : '130',
            distance : '300'
        },
        {
            crossingName : 'dogy-road',
            disc : [ 
                { id:'p009', phaseName : 'south-east', duration : '60' },
                { id:'p010', phaseName : 'south-north', duration : '30', pointTo : 'p006' },
                { id:'p011', phaseName : 'south-west', duration : '30' }, 
                { id:'p012', phaseName : 'west-north', duration : '30' },
            ],
            operated : '140',
            distance : '100'
        },
    ],
}
TDGraph.init(opt)

// setTimeout(function(){
//     TDGraph.reset(opt)
// },5000)

console.log(TDGraph)
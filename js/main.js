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
                { id:'p002',phaseName : 'south-north', duration : '20' },
                { id:'p003',phaseName : 'south-west', duration : '30' }, 
                { id:'p004',phaseName : 'west-north', duration : '20' },
            ],
            operated : '60',
            distance : '200'
        },
        {
            crossingName : 'cat-road',
            disc : [ 
                { id:'p005', phaseName : 'south-east', duration : '30' }, 
                { id:'p006', phaseName : 'south-north', duration : '20' , pointTo : 'p002' },
                { id:'p007', phaseName : 'south-west', duration : '30' }, 
                { id:'p008', phaseName : 'west-north', duration : '20' },
            ],
            operated : '60',
            distance : '300'
        },
        {
            crossingName : 'dogy-road',
            disc : [ 
                { id:'p009', phaseName : 'south-east', duration : '30' },
                { id:'p010', phaseName : 'south-north', duration : '20', pointTo : 'p006' },
                { id:'p011', phaseName : 'south-west', duration : '30' }, 
                { id:'p012', phaseName : 'west-north', duration : '20' },
            ],
            operated : '80',
            distance : '100'
        },
    ],
}
TDGraph.init(opt)

// setTimeout(function(){
//     TDGraph.reset(opt)
// },5000)

console.log(TDGraph)
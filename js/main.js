
var TDGraph = {

    settings : {
        canvasId : '',
        phase : [],
        updateCycle : 1000,
        padding : 100,
        phaseWidth : 10,
        phaseStrokeRadius : 2,
    },
    el : {},
    data : {},

    setInitData : function(phaseArray){
        //求最大相位差 保存相位已运行时间初始值
        var phaseOperated = [];
        phaseArray.map(function(el){
            phaseOperated.push(parseInt(el.operated));
        })
        this.data.phaseOperated = phaseOperated; //保存各相位已运行时间

        this.setAxisYDivider();         //y轴相位绘制坐标
        this.setPhaseLineShouldUpdate(phaseArray);     //各岔路口相位组是否更新指针数组
        this.setPhaseGroupShouldSwap(phaseArray);
        this.setGreenPhaseShouldUpdate(phaseArray);
        this.setTotalPhaseDuration(phaseArray[0]);      //路口相位时间总长 t 

        //求展示完整相位集的x轴最大时间单位， x轴刻度1s对应的实际像素宽度
        var chartWidth = this.getCanvasWidth() - this.getPadding() * 2;
        var maxAxisX = this.data.totalPhaseDuration * 2; 
        this.data.axisXUnitWidth = Math.round(chartWidth / maxAxisX * 1000) / 1000;  //保留3位小数 

        this.el.visiblePhaseGroups = []; //初始化可视区相位组数组
        this.el.currentPhaseGroup = [];  //初始化当前相位组数组
        this.el.greenPhase = []; //初始化当前绿灯数组
        

        return this;
    },

    setTotalPhaseDuration : function(singlePhaseArray){
        var totalDuration = 0;
        var singleCrosssingPhase = singlePhaseArray.disc;
        singleCrosssingPhase.map(function(el){
            totalDuration = totalDuration + parseInt(el.duration);
        })
        this.data.totalPhaseDuration = totalDuration; 
        return totalDuration;
    },

    getTotalPhaseDuration : function(){
        return this.data.totalPhaseDuration;
    },

    setAxisYDivider : function(){

        var phase = this.settings.phase;

        if(phase.length > 0){
            var inputDividerArray = [];
            phase.map(function(el){
                inputDividerArray.push(parseInt(el.distance));
            })
        }

        this.data.axisYDivider = this._crossingAxisYArray(inputDividerArray);
        
        return this;
    },

    getAxisYDivider : function(){
        return TDGraph.data.axisYDivider;
    },

    setPhaseLineShouldUpdate : function(phaseArray){
        TDGraph.data.phaseLineShouldUpdate = [];
        for(var i=0, l=phaseArray.length; i<l; i++ ){
            TDGraph.data.phaseLineShouldUpdate.push(false);
        }
    },

    getPhaseLineShouldUpdate : function(){
        return TDGraph.data.phaseLineShouldUpdate;
    },

    setGreenPhaseShouldUpdate : function(phaseArray){
        TDGraph.data.greenPhaseShouldUpdate = [];
        for(var i=0, l=phaseArray.length; i<l; i++ ){
            TDGraph.data.greenPhaseShouldUpdate.push(false);
        }
    },

    getGreenPhaseShouldUpdate : function(){
        return TDGraph.data.greenPhaseShouldUpdate;
    },

    _crossingAxisYArray : function(axisYDividerArray){
        var axisH = this.getCanvasHeight() - this.settings.padding * 2 - 50 ; // -50 让最上面的一条相位不顶天
        var inputH = 0;
        axisYDividerArray.map(function(el){
            inputH = inputH + parseInt(el);
        })

        var yArray = [];
        var axisYCount = TDGraph.settings.padding + 50;
        //var yInputCount = 0;
        yArray.push(axisYCount);
        axisYDividerArray.map(function(el){
            var yInputCount = parseInt(el);
            var y = ( yInputCount / inputH ) * axisH;
            axisYCount = axisYCount + y;
            yArray.push(axisYCount);
        })
        yArray.pop();

        return yArray;
    },

    draw : function(){
        this._drawAxis();
        this._drawLayers();
        this._drawMask();
        return this;
    },

    _drawAxis : function(){
        var p = this.getPadding();
        var w = this.getCanvasWidth();
        var h = this.getCanvasHeight();
        var graph = this.el.canvas;

        var axis = new zrender.Polyline({
            shape : {
                points : [
                    [p, p],
                    [p, h - p],
                    [w - p, h - p]
                ]
            },
            style: {
                stroke: 'black',
                lineWidth : 4
            }
        })

        var referenceLine =  new zrender.Line({
            shape : {
                x1 : w / 2,
                y1 : p,
                x2 : w / 2,
                y2 : h - p
            },
            style: {
                stroke: 'black',
                opacity : 0.1,
                lineWidth : 4
            }
        })

        graph.add(axis);
        graph.add(referenceLine);

    },

    _drawLayers : function(){

        var visible = []

        for(var i=0; i<3; i++){   //生成3份相位组集合 ，覆盖整个可视区

            var crossingGroup = new zrender.Group();
            var phaseArray = this.settings.phase;
    
            phaseArray.map(function(el){
                var phaseGroup = TDGraph._drawPhaseGroup(el.disc, el.operated, i-1);
                var arrowGroup = TDGraph._drawArrowGroup(el.disc, el.operated, i-1);
                crossingGroup.add(phaseGroup);
                crossingGroup.add(arrowGroup);
     
            });
            TDGraph.el.canvas.add(crossingGroup); //添加元素至画布

            visible.push(crossingGroup);
            
        }

        TDGraph.el.visiblePhaseGroups = visible; //保存可视区相位组数组
        TDGraph._initCurrentPhaseGroup();
        TDGraph._lightUpCurrentPhaseGroup();
        
    },

    _initCurrentPhaseGroup : function(){
        //初始化的当前相位组必为visible第二组
        var g = TDGraph.getVisiblePhaseGroups();
        TDGraph.el.currentPhaseGroup = g[1];

    },

    _drawMask : function(){

    },

    _drawPhaseGroup: function(phaseGroupArray, phaseOperated, count){
        var group = new zrender.Group();
        var unitWidth = TDGraph.getAxisXUnitWidth();
        var phaseAxisX = TDGraph.getCanvasWidth() / 2 - parseInt(phaseOperated) * unitWidth 
            + count * TDGraph.getTotalPhaseDuration() * unitWidth;

        phaseGroupArray.map(function(el){
            //console.log(el)
            var x = phaseAxisX;
            var y = TDGraph.getAxisYByOperated(phaseOperated) - TDGraph.settings.phaseWidth / 2;
            var w = parseInt(el.duration) * unitWidth;
            var rect = new zrender.Rect({
                shape : {
                    x : x,
                    y : y,
                    width : w,
                    height : TDGraph.settings.phaseWidth
                },
                style: {
                    fill : 'pink',
                    stroke: '#fff',
                    lineWidth : 1,
                    text : parseInt(el.duration),
                    textFill : 'black',
                    fontSize : 10
                },
                duration : parseInt(el.duration)
            })

            group.add(rect);

            phaseAxisX = phaseAxisX + w;
        })
        
        group.isPhase = true; //标识一下相位组

        return group;
    },

    _drawArrowGroup : function(phaseGroupArray, phaseOperated, count){
        
        var allPhase = this.settings.phase;
        var unitWidth = TDGraph.getAxisXUnitWidth();
        var totalDuration = TDGraph.getTotalPhaseDuration();
        var faceUp = true;
        var g = new zrender.Group();

        g.isArrow = true;  //标识该group是箭头图形

        phaseGroupArray.map(function(el){
            if(el.pointTo){
                var startPos = TDGraph._computePointTargetPosition(el.id);
                var endPos = TDGraph._computePointTargetPosition(el.pointTo);

                if(startPos.y > endPos.y){ //箭头朝下
                    faceUp = false
                }

                var x1 = startPos.x - count * totalDuration * unitWidth;
                var x2 = endPos.x - count * totalDuration * unitWidth;
                var y1 = faceUp? startPos.y + parseInt(TDGraph.settings.phaseWidth) / 2 + 4 : startPos.y - parseInt(TDGraph.settings.phaseWidth) / 2 -4;
                var y2 = faceUp? endPos.y - parseInt(TDGraph.settings.phaseWidth) / 2 -4 : endPos.y + parseInt(TDGraph.settings.phaseWidth) / 2 +4;

                var line = new zrender.Line({
                    shape : {
                        x1 : x1,
                        y1 : y1,
                        x2 : x2,
                        y2 : y2
                    },
                    style: {
                        stroke: 'gray',
                        opacity : 1,
                        lineWidth : 2
                    }
                });

                var dot = new zrender.Circle({
                    shape: {
                        cx : x2,
                        cy : y2,
                        r: 4,
                    },
                    style:{
                        fill : 'gray',
                        stroke: 'white',
                        lineWidth : 2
                    }
                })

                g.add(dot);
                g.add(line);

            }
        })

        return g;
    },

    _computePointTargetPosition : function(targetId){
        var tagetLineIndex = targetGroupIndex = tagetLineOperated = preTotalW =  w = x = y = 0;
        this.settings.phase.map(function(el, index){
            el.disc.map(function(item, count){
                if(item.id === targetId){
                    tagetLineIndex = index;
                    targetGroupIndex = count;
                    w = item.duration;
                }
            })
        });
        tagetLineOperated = this.getPhaseOperated()[tagetLineIndex];

        for(var i=0; i<targetGroupIndex; i++){
            preTotalW = preTotalW + parseInt(TDGraph.settings.phase[tagetLineIndex].disc[i].duration);
        }

        x = TDGraph.getCanvasWidth() / 2 + (preTotalW + w / 2 - parseInt(tagetLineOperated)) * TDGraph.getAxisXUnitWidth();
        y = this.getAxisYDivider()[tagetLineIndex];

        return {
            x : x,
            y : y
        }
    },

    animate : function(){
        var g = TDGraph.getVisiblePhaseGroups();
        var updateCycle = parseInt(TDGraph.settings.updateCycle);
        TDGraph.timer = setInterval(function(){
            TDGraph.updatePhaseOperated(updateCycle);
            TDGraph.updateGreenPhase();
            TDGraph.updateVisiblePhaseGroups();
        }, updateCycle)
    },

    getPadding : function(){
        return parseInt(TDGraph.settings.padding)
    },

    getAxisYByOperated : function(operatedInt){
        var index = 0;
        this.settings.phase.map(function(el, i){
            if( parseInt(el.operated) === parseInt(operatedInt) ){
                index = i;
                return false;
            }
        })
        return TDGraph.getAxisYDivider()[index];
    },

    getPhaseOperated : function(){
        return TDGraph.data.phaseOperated;
    },

    setPhaseOperated : function(newOperatedArray){
        TDGraph.data.phaseOperated = newOperatedArray;
    },

    updatePhaseOperated : function(updateCycle){
        var phaseOperated = this.getPhaseOperated();
        var totalPhaseDuration = this.getTotalPhaseDuration()
        phaseOperated.map(function(time, index){
            phaseOperated[index] = time + updateCycle / 1000;   //对象非引用类型，必须直接修改
            if(time >= totalPhaseDuration ){
                phaseOperated[index] = time - totalPhaseDuration;
                TDGraph.data.phaseLineShouldUpdate[index] = true;
            }
        });
    },

    updateGreenPhase : function(){
        var referenceX = this.getCanvasWidth() / 2;
        this.el.greenPhase.map(function(el, index){
            if(el.shape.x + el.duration < referenceX){
                TDGraph.data.greenPhaseShouldUpdate[index] = true;
            }
        })

    },

    getAxisXUnitWidth : function(){
        return TDGraph.data.axisXUnitWidth;
    },

    getMaxAxisX : function(){
        return TDGraph.data.maxAxisX;
    },

    resize : function(opt){
        TDGraph.el.canvas.resize(opt);
    },

    getCanvasWidth : function(){
        return TDGraph.el.canvas.getWidth();
    },

    getCanvasHeight : function(){
        return TDGraph.el.canvas.getHeight();
    },

    getVisiblePhaseGroups : function(){
        return TDGraph.el.visiblePhaseGroups;
    },

    updateVisiblePhaseGroups : function(updateCycle){
        var layer = this.getVisiblePhaseGroups();
        layer.map(function(group, index){

            if(TDGraph.getPhaseLineShouldUpdate()[index]){
                TDGraph._clearCurrentLightUp();
                TDGraph.shufflePhaseLine(group);
                TDGraph.setCurrentPhaseGroup();
                TDGraph._lightUpCurrentPhaseGroup();
                TDGraph.getPhaseLineShouldUpdate()[index] = false;
            }

            if(TDGraph.getGreenPhaseShouldUpdate()[index]){
                TDGraph._clearGreenPhase();
                TDGraph._phaseTurnGreen();
            }

            var operated = TDGraph.getPhaseOperated()[index];
            TDGraph.updatePhaseLine(line, operated)
        })
    },

    shufflePhaseLine : function(phaselineGroup){
        var first = phaselineGroup.childAt(0);
        phaselineGroup.remove(first);
        phaselineGroup.add(first);
    },

    updatePhaseLine : function(phaselineGroup, phaseOperated){   //不要直接进行x坐标推移，会随时间产生误差，要根据已运行时间推算x坐标
        //console.log(phaselineGroup)
        var unitWidth = TDGraph.getAxisXUnitWidth();
        
        phaselineGroup.eachChild(function(group, index){
            var phaseAxisX = TDGraph.getCanvasWidth() / 2 - parseInt(phaseOperated) * unitWidth 
        + (index - 1) * TDGraph.getTotalPhaseDuration() * unitWidth;
            group.eachChild(function(el){
                var x = phaseAxisX;
                //console.log(x)
                el.attr({
                    shape : {
                        x : x
                    }
                })
                var w = parseInt(el.duration) * unitWidth;
                phaseAxisX = phaseAxisX + w;
            })
        })

    },

    setCurrentPhaseGroup : function(){
        //当前相位组都是图形数组里的第二组
        var g = TDGraph.getVisiblePhaseGroups();
        g.map(function(el){
            TDGraph.el.currentPhaseGroup.push( el.childAt(1) )
        })
        //console.log(TDGraph.el.currentPhaseGroup)
    },

    getCurrentPhaseGroup : function(){
        return TDGraph.el.currentPhaseGroup;
    },

    _lightUpCurrentPhaseGroup : function(){

        TDGraph.getCurrentPhaseGroup().eachChild(function(el){
            if(el.isPhase){
                el.eachChild(function(phase){
                    //console.log(phase.isArrow)
                    phase.attr({
                        style : {
                            fill : 'red'
                        }
                    })
                });
            }
        });
        TDGraph._phaseTurnGreen();
    },

    _clearCurrentLightUp : function(){
        TDGraph._clearGreenPhase();
        TDGraph.getCurrentPhaseGroup().map(function(el){
            el.eachChild(function(phase){
                phase.attr({
                    style : {
                        fill : 'pink'
                    }
                })
            });
        });
        TDGraph.el.currentPhaseGroup = [];
    },

    _clearGreenPhase : function(){

        TDGraph.el.greenPhase.map(function(el){
            el.attr({
               style : {
                   fill : 'red'
               }
            })
        })

        TDGraph.el.greenPhase = []
    },

    _phaseTurnGreen(){
        TDGraph.getCurrentPhaseGroup().eachChild(function(el){
            var referenceX =  TDGraph.getCanvasWidth() / 2;
            if(el.isPhase){
                el.eachChild(function(phase){
                    //console.log(phase)
                    if( phase.shape.x <= referenceX && phase.shape.x + phase.shape.width > referenceX ){
                        phase.attr({
                            style : {
                                fill : 'green'
                            }
                        })
                        TDGraph.el.greenPhase.push(phase);
                    }
                });
            } 
        });
    },

    update : {

    },

    initCanvas : function(){
        var el = document.getElementById(TDGraph.settings.canvasId);
        TDGraph.el.canvas = zrender.init(el);
        return this;
    },

    init : function(config){
        for(var prop in TDGraph.settings) {
            if(config[prop]){
                TDGraph.settings[prop] = config[prop];
            }
        }

        this.initCanvas()
            .setInitData(config.phase)
            .draw()
            //.animate();
            
    }
}

TDGraph.init({
    canvasId : 'time-distance-graph',
    phase : [
        {
            crossingName : 'monkey-road',
            disc : [ 
                { id:'p001', phaseName : 'south-east', duration : '30', pointTo : 'p007' }, 
                { id:'p002',phaseName : 'south-north', duration : '50' },
                { id:'p003',phaseName : 'south-west', duration : '40' }, 
                { id:'p004',phaseName : 'west-north', duration : '30' },
            ],
            operated : '32',
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
            operated : '62',
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
            operated : '110',
            distance : '100'
        },
    ],
})

console.log(TDGraph)
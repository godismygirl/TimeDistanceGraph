var TDGraph = {

    settings : {
        canvasId : '',
        phase : [],
        updateCycle : 1000,
        padding : 80,
        phaseWidth : 14,
        title : '',
        titleFontSize : 18,
        color : {
            title : '#BDBDBD',
            background : '#212121',
            viewport : '#263238',
            axis : '#0a0a0a',
            centralAxis : '#fff',
            redPhase : '#DD2C00',
            greenPhase : '#2E7D32',
            inactivePhase : '#F06292',
            phaseStroke : '#0a0a0a',
            phaseText : '#0a0a0a',
            arrow : '#546E7A',
        }
    },
    el : {},
    data : {},

    initData : function(phaseArray){
        //求最大相位差 保存相位已运行时间初始值
        this.initAxisYDivider();         //y轴相位绘制坐标
        this.initTotalPhaseDuration(phaseArray[0]);       //路口相位时间总长 t 
        this.initPhaseLineShouldUpdate(phaseArray);     //各岔路口相位组是否更新指针数组
        this.initPhaseGroupShouldSwap(phaseArray);
        this.initGreenPhaseShouldUpdate(phaseArray);
        this.el.allVisible = []; //初始化可视区相位组数组
        this.el.currentPhaseGroup = [];  //初始化当前相位组数组
        this.el.greenPhase = []; //初始化当前绿灯数组

        return this;
    },

    initPhaseGroupShouldSwap : function(phaseArray){
        this.data.phaseGroupShouldSwap = false;
        var d = [];
        phaseArray.map(function(el){
            d.push(parseInt(el.operated));
        });

        var totalDuration = this.data.totalPhaseDuration;
        var chartWidth = this.getCanvasWidth() - this.getPadding() * 2;

        var maxDiff = Math.max.apply( null, d ) - Math.min.apply( null, d );
        var maxAxisX = this.data.totalPhaseDuration * 2 - maxDiff; 
        //求展示完整相位集的x轴最大时间单位， x轴刻度1s对应的实际像素宽度
        this.data.groupPhaseCountDown = maxAxisX / 2 - Math.min.apply( null, d );
        this.data.axisXUnitWidth = Math.round(chartWidth / maxAxisX * 1000) / 1000;  //保留3位小数 

    },

    initTotalPhaseDuration : function(singlePhaseArray){
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

    initAxisYDivider : function(){

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

    initPhaseLineShouldUpdate : function(phaseArray){
        var phaseOperated = [];
        phaseArray.map(function(el){
            phaseOperated.push(parseInt(el.operated));
        })
        this.data.phaseOperated = phaseOperated; //保存各相位已运行时间

        TDGraph.data.phaseLineShouldUpdate = [];
        for(var i=0, l=phaseArray.length; i<l; i++ ){
            TDGraph.data.phaseLineShouldUpdate.push(false);
        }
    },

    _crossingAxisYArray : function(axisYDividerArray){
        var axisH = this.getCanvasHeight() - this.settings.padding * 2 - 50 ; // -50 让最上面的一条相位不顶天
        var inputH = 0;
        axisYDividerArray.map(function(el){
            inputH = inputH + parseInt(el);
        })

        var yArray = [];
        var axisYCount = TDGraph.settings.padding + 50;

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
        this._drawViewPort();
        this._drawLayers();
        this._drawMask();
        this._drawAxis();
        this._drawTitle();
        this._drawDate();
        return this;
    },

    _drawViewPort : function(){
        var p = this.getPadding();
        var w = this.getCanvasWidth();
        var h = this.getCanvasHeight();
        var canvas = this.el.canvas;
        var viewport = new zrender.Rect({
            shape : {
                x : 0,
                y : 0,
                width : w,
                height : h
            },
            style : {
                fill : TDGraph.settings.color.background
            }
        });

        var chartBackground = new zrender.Rect({
            shape : {
                x : p,
                y : p,
                width : w - p * 2,
                height : h - p * 2 
            },
            style : {
                fill : TDGraph.settings.color.viewport
            }
        });

        canvas.add(viewport);
        canvas.add(chartBackground);
    },

    _drawAxis : function(){
        var p = this.getPadding();
        var w = this.getCanvasWidth();
        var h = this.getCanvasHeight();
        var canvas = this.el.canvas;

        var axis = new zrender.Polyline({
            shape : {
                points : [
                    [p, p],
                    [p, h - p],
                    [w - p, h - p],
                    [w - p, p],
                    [p, p]
                ]
            },
            style: {
                stroke: TDGraph.settings.color.axis,
                lineWidth : 4
            }
        });

        var referenceLine =  new zrender.Line({
            shape : {
                x1 : w / 2,
                y1 : p,
                x2 : w / 2,
                y2 : h - p
            },
            style: {
                stroke: TDGraph.settings.color.centralAxis,
                opacity : 0.2,
                lineWidth : 4
            }
        })
       
        canvas.add(referenceLine);
        canvas.add(axis);
    },

    _drawTitle : function(){
        var p = this.getPadding();
        var w = this.getCanvasWidth();
        var h = this.getCanvasHeight();
        if(TDGraph.settings.title !== ""){
            var titleBox = new zrender.Rect({
                shape : {
                    x : 0,
                    y : p - TDGraph.settings.titleFontSize - 20,
                    width : w,
                    height : TDGraph.settings.titleFontSize
                },
                style : {
                    fill : 'none',
                    text : TDGraph.settings.title,
                    textFill : TDGraph.settings.color.title,
                    fontSize : TDGraph.settings.titleFontSize,
                    textAlign : 'center',
                    fontWeight : 500
                }
            })
        }
        this.el.canvas.add(titleBox);
    },

    _drawDate : function(){
        var p = this.getPadding();
        var w = this.getCanvasWidth();
        var h = this.getCanvasHeight();

        var date = new zrender.Rect({
            shape : {
                x : 0,
                y : h - p + 15,
                width : w,
                height : TDGraph.settings.titleFontSize
            },
            style : {
                fill : 'none',
                text : TDGraph.getFormatDate(),
                textFill : TDGraph.settings.color.title,
                fontSize : TDGraph.settings.titleFontSize - 4,
                textAlign : 'center',
                fontWeight : 500
            }
        })
        this.el.canvas.add(date);
        this.dateTimer = setInterval(function(){
            date.attr({
                style : {
                    text : TDGraph.getFormatDate()
                }
            })
        }, 1000);
        
    },

    getFormatDate : function(){
        var date = new Date();
        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();
        hour = hour < 10 ? '0' + hour : hour;
        minute = minute < 10 ? '0' + minute : minute;
        second = second < 10 ? '0' + second : second;
        var dateString = hour + ' : ' + minute + ' : ' + second;
        return dateString;
    },

    _drawLayers : function(){

        var visible = []
        var phaseArray = this.settings.phase;

        for(var i=0; i<3; i++){   //生成3份相位组集合 ，覆盖整个可视区
            var crossingGroup = new zrender.Group();
            phaseArray.map(function(el, index){
                var phaseGroup = TDGraph._drawPhaseGroup(el.disc, el.operated, index, i-1);
                var arrowGroup = TDGraph._drawArrowGroup(el.disc, i-1);
                crossingGroup.add(arrowGroup);
                crossingGroup.add(phaseGroup);
            });
            TDGraph.el.canvas.add(crossingGroup); //添加元素至画布
            visible.push(crossingGroup);
        }

        TDGraph.el.allVisible = visible; //保存可视区相位组数组
        TDGraph._initVisiblePhase(visible);
        TDGraph._initCurrentPhaseGroup();
        TDGraph._initGreenPhase();

        TDGraph.el.currentPhaseGroup.map(function(el){
            TDGraph._lightUpCurrentPhaseGroup(el);
        });
        TDGraph.el.greenPhase.map(function(el){
            TDGraph._lightUpGreenPhase(el)
        });
        
    },

    _initVisiblePhase:function(allVisible){
        var group = []
        allVisible.map(function(el, index){
            var arr = []
            group.push(arr);
            el.eachChild(function(item){
                if(item.isPhase){
                    group[index].push(item)
                }
            });
        });
        TDGraph.el.visiblePhase = group;
    },

    getVisiblePhase : function(){
        return TDGraph.el.visiblePhase;
    },

    _initCurrentPhaseGroup : function(){
        //初始化的当前相位组必为visible第二组
        var g = TDGraph.getAllVisible()[1];
        g.eachChild(function(el){
            if(el.isPhase){
                el.isCurrent = true;
                TDGraph.el.currentPhaseGroup.push(el);
            }
        })
    },

    _initGreenPhase : function(){
        var currentPhaseGroup = this.getCurrentPhaseGroup();
        this.el.greenPhase = []; //存储绿色相位元素本身
        this.data.greenPhaseCycle = []; //存储绿色相位变化周期参考
        this.settings.phase.map(function(el){
            var arr = [];
            var total = 0;
            el.disc.map(function(item){
                total = total + parseInt(item.duration);
                arr.push(total);
            });
            TDGraph.data.greenPhaseCycle.push(arr);
        });

        TDGraph.data.greenPhaseCycle.map(function(el, index){
            el.greenPhaseIndex = TDGraph._computeGreenPhaseIndex(el, TDGraph.data.phaseOperated[index]);
            TDGraph.el.greenPhase.push(currentPhaseGroup[index].childAt(el.greenPhaseIndex));
        });

    },

    _computeGreenPhaseIndex : function(phaseDurationArray, phaseOperated){
        
        var greenPhaseIndex = 0;
        if(phaseOperated >= TDGraph.getTotalPhaseDuration()){
            phaseOperated = 0;
        }
        for(var i=0,l=phaseDurationArray.length; i<l; i++){
            if(phaseOperated < phaseDurationArray[i]){
                greenPhaseIndex = i;
                break;
            }
        }
        return greenPhaseIndex;
    },

    _drawMask : function(){ 
        var padding = parseInt(TDGraph.settings.padding);
        var canvasWidth = this.getCanvasWidth();
        var canvasHeight = this.getCanvasHeight();

        var leftMask = new zrender.Rect({
            shape : {
                x : 0,
                y : 0,
                width : padding,
                height : canvasHeight
            },
            style : {
                fill : TDGraph.settings.color.background
            }
        });
        var rightMask = new zrender.Rect({
            shape : {
                x : canvasWidth - padding,
                y : 0,
                width : padding,
                height : canvasHeight
            },
            style : {
                fill : TDGraph.settings.color.background
            }
        });

        this.el.canvas.add(leftMask);
        this.el.canvas.add(rightMask);
        
    },

    _drawPhaseGroup: function(phaseGroupArray, phaseOperated, axisYIndex ,count){
        
        var group = new zrender.Group();
        var unitWidth = TDGraph.getAxisXUnitWidth();
        var phaseAxisX = TDGraph.getCanvasWidth() / 2 - parseInt(phaseOperated) * unitWidth 
            + count * TDGraph.getTotalPhaseDuration() * unitWidth;

        group.isPhase = true; //标识一下相位组
           
        phaseGroupArray.map(function(el){
            //console.log(el)
            var x = phaseAxisX;
            var y = TDGraph.getAxisYDivider()[axisYIndex] - TDGraph.settings.phaseWidth / 2;
            var w = parseInt(el.duration) * unitWidth;
            var rect = new zrender.Rect({
                shape : {
                    x : x,
                    y : y,
                    width : w,
                    height : TDGraph.settings.phaseWidth
                },
                style: {
                    fill : TDGraph.settings.color.inactivePhase,
                    stroke: TDGraph.settings.color.phaseStroke,
                    lineWidth : 1,
                    text : parseInt(el.duration),
                    textFill : TDGraph.settings.color.phaseText,
                    fontSize : 10,
                },
                duration : parseInt(el.duration)
            })

            group.add(rect);
            phaseAxisX = phaseAxisX + w;
        });
        
        console.log(group);
        return group;
    },

    _drawArrowGroup : function(phaseGroupArray, count){
        
        var allPhase = this.settings.phase;
        var unitWidth = TDGraph.getAxisXUnitWidth();
        var totalDuration = TDGraph.getTotalPhaseDuration();
        var faceUp = true;
        var faceLeft = true;
        var g = new zrender.Group();

        g.isArrow = true;  //标识该group是箭头图形

        phaseGroupArray.map(function(el){

            var endPos = TDGraph._computePointTargetPosition(el.pointTo);

            if(el.pointTo && endPos){
                var startPos = TDGraph._computePointTargetPosition(el.id);

                if(startPos.x < endPos.x){//箭头朝右
                    faceLeft = false;
                }

                if(startPos.y < endPos.y){ //箭头朝下
                    faceUp = false
                }

                var x1 = faceLeft? startPos.x + count * totalDuration * unitWidth -5 : startPos.x + count * totalDuration * unitWidth -5;
                var x2 = faceLeft? endPos.x + count * totalDuration * unitWidth + 5 : endPos.x + count * totalDuration * unitWidth - 5;
                var y1 = faceUp? startPos.y - parseInt(TDGraph.settings.phaseWidth) / 2 - 4 : startPos.y + parseInt(TDGraph.settings.phaseWidth) / 2 +4;
                var y2 = faceUp? endPos.y + parseInt(TDGraph.settings.phaseWidth) / 2 +6 : endPos.y - parseInt(TDGraph.settings.phaseWidth) / 2 -6;
                var line = new zrender.Line({
                    shape : {
                        x1 : x1,
                        y1 : y1,
                        x2 : x2,
                        y2 : y2
                    },
                    style: {
                        stroke: TDGraph.settings.color.arrow,
                        opacity : 1,
                        lineWidth : 2
                    }
                });

                var dot = new zrender.Circle({
                    shape: {
                        cx : x2,
                        cy : y2,
                        r: 3,
                    },
                    style:{
                        fill : TDGraph.settings.color.arrow,
                    }
                });

                g.add(dot);
                g.add(line);
            }
        })

        return g;
    },

    _computePointTargetPosition : function(targetId){
        var targetExist = false;
        var tagetLineIndex = targetGroupIndex = tagetLineOperated = preTotalW =  w = x = y = 0;
        this.settings.phase.map(function(el, index){

            for(var i=0,l=el.disc.length; i<l; i++){
                if(el.disc[i].id === targetId){
                    tagetLineIndex = index;
                    targetGroupIndex = i;
                    w = el.disc[i].duration;
                    targetExist = true;
                    break;
                }
            }
        });

        if(targetExist){

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
        }
        
    },

    animate : function(){

        var g = TDGraph.getAllVisible();
        var updateCycle = parseInt(TDGraph.settings.updateCycle);
        TDGraph.animationTimer = setInterval(function(){

            TDGraph.moveAll();

            TDGraph.updateGroupPhaseCountDown();
            TDGraph.updatePhaseOperated();

            if(TDGraph.data.phaseGroupShouldSwap){
                TDGraph.swapGroupPhase();
            }

            var lineNeedUpdate = TDGraph.getPhaseLineShouldUpdate();
            if(lineNeedUpdate){
                TDGraph.updatePhaseLine(lineNeedUpdate);
            }

            var greenPhaseNeedUpdate = TDGraph.getGreenPhaseShouldUpdate();
            if(greenPhaseNeedUpdate){
               TDGraph.updateGreenPhase(greenPhaseNeedUpdate);
            }

        }, updateCycle)
    },

    moveAll : function(){
        TDGraph.getAllVisible().map(function(el){
            var x = el.position[0];
            el.attr({
                position : [x - TDGraph.settings.updateCycle / 1000 * TDGraph.data.axisXUnitWidth, 0]
            });
        });
    },

    updateGroupPhaseCountDown : function(){
        TDGraph.data.groupPhaseCountDown = TDGraph.data.groupPhaseCountDown - TDGraph.settings.updateCycle / 1000;
        if(TDGraph.data.groupPhaseCountDown <= 0){
            TDGraph.data.groupPhaseCountDown = TDGraph.data.totalPhaseDuration;
            TDGraph.data.phaseGroupShouldSwap = true;
        }
    },

    swapGroupPhase : function(){
        var allVisible = this.getAllVisible();
        var firstGroup = allVisible[0];
        var x = firstGroup.position[0];
        var moveWidth = TDGraph.data.totalPhaseDuration * 3 * TDGraph.data.axisXUnitWidth;
        firstGroup.attr({
            position : [x + moveWidth, 0]
        });

        //调整allVisble数组的排序
        this.el.allVisible.shift();
        this.el.allVisible.push(firstGroup);

        //调整visblePhase数组的排序
        var firstPhase = this.el.visiblePhase.shift();
        this.el.visiblePhase.push(firstPhase);

        TDGraph.data.phaseGroupShouldSwap = false;
    },

    updatePhaseLine : function(updateCount){
        updateCount.forEach(function(i){
            var currentLine = TDGraph.getCurrentPhaseGroup()[i];
            var targetCol = 0;
            TDGraph.getVisiblePhase().map(function(el, index){
                if(el[i].isCurrent){
                    targetCol = index + 1;
                }
            });
    
            TDGraph._clearCurrentLightUp(currentLine);
    
            var targetLine = TDGraph.getVisiblePhase()[targetCol][i];
            targetLine.isCurrent = true;
    
            TDGraph.el.currentPhaseGroup[i] = targetLine;
            TDGraph.el.greenPhase[i] = targetLine.childAt(0);
            TDGraph._lightUpCurrentPhaseGroup(targetLine);
            TDGraph.data.phaseLineShouldUpdate[i] = false;
        });
    },

    _clearCurrentLightUp : function(phaseLine){
        phaseLine.isCurrent = false;
        phaseLine.eachChild(function(phase){
            phase.attr({
                style : {
                    fill : TDGraph.settings.color.inactivePhase
                }
            });
        });
    },

    updateGreenPhase : function(updateCount){
        //updateCount 第几行需要更新绿灯
        updateCount.forEach(function(i){
            var greenIndex = TDGraph.data.greenPhaseCycle[i].greenPhaseIndex;
            TDGraph._lightOffGreenPhase(TDGraph.el.greenPhase[i])
            TDGraph.el.greenPhase[i] = TDGraph.el.currentPhaseGroup[i].childAt(greenIndex);
            TDGraph._lightUpGreenPhase(TDGraph.el.greenPhase[i]);
            TDGraph.data.greenPhaseShouldUpdate[i] = false;
        })
        
    },

    _lightUpGreenPhase : function(el){
        el.attr({
            style : {
                fill : TDGraph.settings.color.greenPhase
            }
        })
    },

    _lightOffGreenPhase : function(el){
        el.attr({
            style : {
                fill : TDGraph.settings.color.redPhase
            }
        })
    },

    getPadding : function(){
        return parseInt(TDGraph.settings.padding)
    },

    getPhaseOperated : function(){
        return TDGraph.data.phaseOperated;
    },

    setPhaseOperated : function(newOperatedArray){
        TDGraph.data.phaseOperated = newOperatedArray;
    },

    updatePhaseOperated : function(){
        var phaseOperated = this.getPhaseOperated();
        var totalPhaseDuration = this.getTotalPhaseDuration();
        var greenPhaseCycle = this.data.greenPhaseCycle;
        phaseOperated.map(function(time, index){
            var operated = time + TDGraph.settings.updateCycle / 1000;   //对象非引用类型，必须直接修改
            phaseOperated[index] = operated;
            if(operated >= totalPhaseDuration ){
                phaseOperated[index] = 0;
                TDGraph.data.phaseLineShouldUpdate[index] = true;   //更新phaseline指针
            }
            //更新greenphase 指针
            var greenLightIndex = TDGraph._computeGreenPhaseIndex(greenPhaseCycle[index], operated);
            if(greenPhaseCycle[index].greenPhaseIndex !==  greenLightIndex){
                greenPhaseCycle[index].greenPhaseIndex = greenLightIndex;
                TDGraph.data.greenPhaseShouldUpdate[index] = true; 
            }
        });
    },

    getPhaseLineShouldUpdate : function(){
        var shouldUpdate = false;
        var result = [];
        this.data.phaseLineShouldUpdate.map(function(el, index){
            if(el){
                result.push(index);
                shouldUpdate = true;
            }
        });

        if(!shouldUpdate){
            result = false;
        }

        return result;
    },

    initGreenPhaseShouldUpdate : function(phaseArray){
        TDGraph.data.greenPhaseShouldUpdate = [];
        for(var i=0, l=phaseArray.length; i<l; i++ ){
            TDGraph.data.greenPhaseShouldUpdate.push(false);
        }
    },

    getGreenPhaseShouldUpdate : function(){
        var shouldUpdate = false;
        var result = [];
        this.data.greenPhaseShouldUpdate.map(function(el, index){
            if(el){
                result.push(index);
                shouldUpdate = true;
            }
        });

        if(!shouldUpdate){
            result = false;
        }

        return result;
    },

    getAxisXUnitWidth : function(){
        return TDGraph.data.axisXUnitWidth;
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

    getAllVisible : function(){
        return TDGraph.el.allVisible;
    },

    shufflePhaseLine : function(phaselineGroup){
        var first = phaselineGroup.childAt(0);
        phaselineGroup.remove(first);
        phaselineGroup.add(first);
    },

    getCurrentPhaseGroup : function(){
        return TDGraph.el.currentPhaseGroup;
    },

    _lightUpCurrentPhaseGroup : function(phaseGroup){

        phaseGroup.eachChild(function(phase){
            //console.log(phase.isArrow)
            phase.attr({
                style : {
                    fill : TDGraph.settings.color.redPhase
                }
            })
        });
    },

    initCanvas : function(){
        var el = document.getElementById(TDGraph.settings.canvasId);
        TDGraph.el.canvas = zrender.init(el);
        return this;
    },

    reset : function(config){
        clearInterval(TDGraph.animationTimer);
        clearInterval(TDGraph.dateTimer);
        TDGraph.el.canvas.clear();
        TDGraph.init(config);
    },

    init : function(config){
        this.settings = zrender.util.merge(TDGraph.settings, config, true)
        this.initCanvas()
            .initData(config.phase)
            .draw()
            .animate();
            
    }
}
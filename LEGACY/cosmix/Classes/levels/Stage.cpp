#include "Stage.h"

Stage::Stage(string _label, float _time, int _points, int _starOne, int _starTwo,int _starThree,int _rotationAngle, int _bonusTime,int _minFigures)
{
    label           = _label;
    waiting_time    = _time;
    points          = _points;
    starOne         = _starOne;
    starTwo         = _starTwo;
    starThree       = _starThree;
    rotationAngle       = _rotationAngle;
	bonusTime		= _bonusTime;
    minFigures      = _minFigures;
    parent = NULL;
    
}
Stage::Stage(void)
{
}


Stage::~Stage(void)
{
}

void Stage::Init(string _label, float _time, int _points, int _starOne, int _starTwo,int _starThree,int _rotationAngle, int _bonusTime, int _minFigures)
{
    label           = _label;
    waiting_time    = _time;
    points          = _points;
    starOne         = _starOne;
    starTwo         = _starTwo;
    starThree       = _starThree;
    rotationAngle   = _rotationAngle;
	bonusTime		= _bonusTime;
    minFigures      = _minFigures;
    
    if (waiting_time < 1.3) {
        waiting_time = 1.3;
    }
    
    parent = NULL;
    
}

void Stage::addFigure(Figure * figure){

    if (figure) {
        figures.push_back(figure);
        for (int i=0; i < figure->count; i++) {
            genFigures.push_back(figure);
			
			map<int,int>::iterator it = uniqueTags.find( figure->tag );
			if( it != uniqueTags.end()){
				it->second++;
			}else{
				uniqueTags.insert( make_pair( figure->tag, 1 ));
			}

        }
    }
}

Figure * Stage::randomFigure(){
    
    int     rIndex      = 0;
    int     maxIndex    = (int) genFigures.size();
    
            rIndex      = CCRANDOM_0_1() * maxIndex;
    Figure * figure     = genFigures[rIndex];
    
    return figure;
}


Figure * Stage::getFigureByColor(int color_index){
    if (color_index>=0 && color_index<(int) genFigures.size()) {
        return  genFigures[color_index];
    }
    return NULL;
}



Stage * Stage::cloneStage( Stage * stage, Stage * toStage ){
    
    if (!toStage) {
        toStage = new Stage();
    }
    
    int nextMinFigures = stage->minFigures + 3 ;
    if (nextMinFigures > 60) {
        nextMinFigures = 60;
    }
    
    toStage->Init(  stage->label, 
                    stage->waiting_time * 0.80,
                    stage->points * 1.1,
                    stage->starOne * 1.1,
                    stage->starTwo * 1.1,
                    stage->starThree * 1.1,
                    stage->rotationAngle,
					stage->bonusTime * 1.18,
                    nextMinFigures );
    
    toStage->parent = stage->parent;
    
    vector<Figure *>::iterator It;

    toStage->figures.clear();
    for ( It = stage->figures.begin(); It != stage->figures.end(); It++) {
        toStage->figures.push_back(*It);
    }

    toStage->genFigures.clear();
    for ( It = stage->genFigures.begin(); It != stage->genFigures.end(); It++) {
        toStage->genFigures.push_back(*It);
    }
    map<int,int>::iterator mapIter = stage->uniqueTags.begin();
    toStage->uniqueTags.clear();
    for (; mapIter != stage->uniqueTags.end(); mapIter++) {
        toStage->uniqueTags.insert(make_pair(mapIter->first, mapIter->second ));
    }
    
    return toStage;    
    
}



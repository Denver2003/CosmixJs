#include "Stage.h"

Stage::Stage(string _label, float _time, int _points, int _starOne, int _starTwo,int _starThree,int _rotationAngle, int _bonusTime)
{
    label           = _label;
    waiting_time    = _time;
    points          = _points;
    starOne         = _starOne;
    starTwo         = _starTwo;
    starThree       = _starThree;
    rotationAngle       = _rotationAngle;
	bonusTime		= _bonusTime;
    parent = NULL;
    
}
Stage::Stage(void)
{
}


Stage::~Stage(void)
{
}

void Stage::Init(string _label, float _time, int _points, int _starOne, int _starTwo,int _starThree,int _rotationAngle, int _bonusTime)
{
    label           = _label;
    waiting_time    = _time;
    points          = _points;
    starOne         = _starOne;
    starTwo         = _starTwo;
    starThree       = _starThree;
    rotationAngle   = _rotationAngle;
	bonusTime		= _bonusTime;
    
    if (waiting_time < 1.8) {
        waiting_time = 1.8;
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



Stage * Stage::cloneStage( Stage * stage, Stage * toStage ){
    
    if (!toStage) {
        toStage = new Stage();
    }
    
    toStage->Init(  stage->label, 
                    stage->waiting_time * 0.83, 
                    stage->points * 1.2, 
                    stage->starOne * 1.2, 
                    stage->starTwo * 1.2, 
                    stage->starThree * 1.2, 
                    stage->rotationAngle,
					stage->bonusTime * 1.18);
    
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



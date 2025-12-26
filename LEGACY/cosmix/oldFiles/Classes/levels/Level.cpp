#include "Level.h"
#include "Bonus.h"

//---------
Level::Level(string _label,string _scene, string _name)
{
    label = _label;
    name = _name;
    scene = _scene;
}
//---------
Level::~Level(void)
{
}
//---------
void Level::addStage(Stage * stage ){

    stages.push_back( stage );  
    stage->parent = this;
}


Stage * Level::getStage( int indexStage ){
	
	if( indexStage < 0 && indexStage > stages.size() ){
		return stages[indexStage];
	}
	return NULL;
}

void Level::addColor(int tag, int r, int g, int b){
	map<int, ccColor3B>::iterator it = colors.find( tag );

	if( it != colors.end()){
		it->second = ccc3(r,g,b);
	}else{
		colors.insert( make_pair( tag, ccc3(r,g,b)));
	}
}

ccColor3B Level::getColor( int tag ){
	map<int, ccColor3B>::iterator it = colors.find( tag );

	if( it != colors.end()){
		return it->second;
	}
	return ccc3(0,0,0);
}
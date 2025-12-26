#include "Figure.h"

Figure::Figure(string _label, string _spriteName, int _tag, int _count, ccColor3B _color )
{
    if (_tag < TAG_FROM) {
        _tag = _tag + TAG_FROM;
    }
    
    label = _label;
    spriteName = _spriteName;
    tag = _tag;
    count = _count;
    color = _color;
    color_index = _tag - TAG_FROM;

    string nums = "1234567890";
    animPrefix = "t";
    for (int i = 0; i < spriteName.size(); i++ ){
        char ch = spriteName[i];
        if ( (ch == '1') || (ch == '2') || (ch == '3') || (ch == '4') || (ch == '5') || (ch == '6') || (ch == '7') || (ch == '8') || (ch == '9') || (ch == '0') ) {
            animPrefix = animPrefix + ch;
        }
    }
    animPrefix = animPrefix + "_";
}

Figure::~Figure(void)
{
}
string Figure::getSpriteName(){
    return spriteName;
}

string Figure::getBatchSpriteName(){
    return spriteName + "0001";
}
string Figure::getBatchSpriteNameNoPhysics(){
    return spriteName + "0002";
}

string Figure::getBatchSpriteNameShadow(){
    return spriteName + "0015";
}

string Figure::getAnimCollidedSprite(){
    return animPrefix + "collided";
}



string Figure::getBatchSpriteNameEye(){
    return spriteName + "0009";
}


string Figure::getSpriteName_01(){
    return spriteName + "_01";
}

string Figure::getAnimWalkName(){
    return animPrefix + "walk";
}

string Figure::getAnimBlinkName(){
    return animPrefix + "blink";
}

string Figure::getAnimBangName(){
    char color[10];
    sprintf(color, "%i", this->color_index );
    return "bang" +  string(color)  ;
}

string Figure::getAnimEyeWalk(){
    return animPrefix + "eye_walk";
}

string Figure::getAnimEyeBlink(){
    return animPrefix + "eye_blink";
}

string Figure::getAnimEyeFall(){
    return animPrefix + "eye_fall";
}

string Figure::getAnimColors(){
    return animPrefix + "colors";
}

string Figure::getExplosionSprite(){

    return "explosion0001";
}
//
//  cameraPoint.cpp
//  cosmix
//
//  Created by denver on 19.12.12.
//
//

#include "cameraPoint.h"
#include "Game.h"

CameraPoint::CameraPoint()
{
    
}

CameraPoint::CameraPoint(string _cameraName, CameraPoint * relativeCameraPoint)
{
    cameraName = _cameraName;
    if (Game::getLoader()) {
        LHSprite *sprite = Game::getLoader()->spriteWithUniqueName(cameraName + "CameraPoint");
        if (sprite) {
            position = sprite->getPosition();
            float deltaX = relativeCameraPoint->position.x - relativeCameraPoint->cameraPosition.x;
            float deltaY = relativeCameraPoint->position.y - relativeCameraPoint->cameraPosition.y;
            
            cameraPosition.x = deltaX - position.x;
            cameraPosition.y = deltaY - position.y;
        }
    }
    
}

CameraPoint::CameraPoint(string _cameraName, CCPoint _zeroPosition, CCPoint _zeroCameraPosition)
{
    cameraName = _cameraName;
    if (Game::getLoader()) {
        LHSprite *sprite = Game::getLoader()->spriteWithUniqueName(cameraName + "CameraPoint");
        if (sprite) {
            position = sprite->getPosition();
            float deltaX = _zeroPosition.x - _zeroCameraPosition.x;
            float deltaY = _zeroPosition.y - _zeroCameraPosition.y;
            
            cameraPosition.x = deltaX - position.x;
            cameraPosition.y = deltaY - position.y;
        }
    }
    
}

CameraPoint::~CameraPoint()
{
    
}

void CameraPoint::setDirect(string _cameraName, CCPoint _zeroCameraPosition)
{
    cameraName = _cameraName;
    LHSprite *sprite = Game::getLoader()->spriteWithUniqueName(cameraName + "CameraPoint");
    if (sprite) {
        position = sprite->getPosition();
    }
    cameraPosition = _zeroCameraPosition;
}
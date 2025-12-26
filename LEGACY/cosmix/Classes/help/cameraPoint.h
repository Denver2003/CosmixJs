//
//  cameraPoint.h
//  cosmix
//
//  Created by denver on 19.12.12.
//
//

#ifndef __cosmix__cameraPoint__
#define __cosmix__cameraPoint__
#include "LevelHelperLoader.h"

class CameraPoint{
public:
    CameraPoint();
    CameraPoint(string _cameraName, CCPoint _zeroPosition, CCPoint _zeroCameraPosition);
    CameraPoint(string _cameraName, CameraPoint * relativeCameraPoint);
    ~CameraPoint();
    void setDirect(string _cameraName, CCPoint _zeroCameraPosition);
    
    string cameraName;
    CCPoint position;
    CCPoint cameraPosition;
    
};


#endif /* defined(__cosmix__cameraPoint__) */

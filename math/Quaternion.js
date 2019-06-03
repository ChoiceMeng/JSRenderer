function Quatemion(w,x,y,z){
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
}

Quatemion.prototype.identity = function(){
    this.w = 1;
    this.x = this.y = this.z = 0;
}

Quatemion.kQuaternionIdentity = Function()
{ 
    return new Quatemion(1.0, 0.0, 0.0, 0.0);
};
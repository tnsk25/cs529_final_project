#File converts raw netCDF data files to csv files. The generated csv file contains the monthly average value of the chosen climate variable of all lat/long values available.
#Creates 118 files from year 1901 to 2018. Place this file in same folder which has the climate variable netCDF and execute.

rm(list = ls())
library(raster)
library(reshape2)

#Change the required file name below
nc.brick_file = brick("cru_ts4.03.1901.2018.wet.dat.nc")

dim(nc.brick_file)

#Create month-year sequence for column names
seq_month_year = format(seq(as.Date(paste0("190101","01"), "%Y%m%d"), 
               as.Date(paste0("201812","12"), "%Y%m%d"),by="month"), 
           "%m")

#Create year sequence for file names
seq_year = format(seq(as.Date(paste0("190101","01"), "%Y%m%d"), 
               as.Date(paste0("201812","12"), "%Y%m%d"),by="year"), 
           "%Y")

year_counter = 1

for (i in 1:1416)
{   
   	nc.temp_df <- as.data.frame(nc.brick_file[[i]], xy = T)
  	nc.temp_df = na.omit(nc.temp_df)
  	colnames(nc.temp_df)<-c("Long","Lat",seq_month_year[i])
  	nc.temp_df = melt(nc.temp_df, id.vars=c("Long","Lat"))
  	if (i == 1)
  	{
  	  df_eachyear = data.frame(matrix(ncol=0,nrow=0))
  	  df_eachyear <- rbind(df_eachyear, nc.temp_df)
  	}
    #Writes csv once 12 monthly is completed
    else if (i%%12 == 0) 
  	{
  		df_eachyear<- rbind(df_eachyear, nc.temp_df)
		  file_name = paste0(seq_year[year_counter],".csv")
		  write.csv(df_eachyear, file_name, row.names = FALSE)
  		df_eachyear= data.frame(matrix(ncol=0,nrow=0))
		  year_counter = year_counter + 1
  	}else{
  		df_eachyear<- rbind(df_eachyear, nc.temp_df)
  	}
}

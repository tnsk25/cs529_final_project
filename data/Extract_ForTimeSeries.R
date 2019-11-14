rm(list = ls())
library(raster)
library(reshape2)

nc.brick_file =brick("cru_ts4.03.1901.2018.tmp.dat.nc")

dim(nc.brick_file)

seq_month_year = format(seq(as.Date(paste0("190101","01"), "%Y%m%d"), 
               as.Date(paste0("201812","12"), "%Y%m%d"),by="month"), 
           "%Y-%m")

seq_year = format(seq(as.Date(paste0("190101","01"), "%Y%m%d"), 
               as.Date(paste0("201812","12"), "%Y%m%d"),by="year"), 
           "%Y")

year_counter = 1

df_years_combined = data.frame(matrix(ncol=0,nrow=0))

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
  	}else if (i%%12 == 0)
  	{
  		df_eachyear<- rbind(df_eachyear, nc.temp_df)
		df_eachyear = aggregate(df_eachyear$value, by=list(df_eachyear$Long, df_eachyear$Lat), data = df_eachyear, mean)
		colnames(df_eachyear)<-c("Long","Lat",seq_year[year_counter])
		df_eachyear = df_eachyear[order(df_eachyear$Long),]
		if (year_counter == 1)
		{
  			df_years_combined<- rbind(df_years_combined, df_eachyear)
		}else 
		{
			df_years_combined[seq_year[year_counter]] = df_eachyear[seq_year[year_counter]]
		}
		  # file_name = paste0(seq_year[year_counter],".csv")
		  # write.csv(df_eachyear, file_name, row.names = FALSE)
  		df_eachyear= data.frame(matrix(ncol=0,nrow=0))
		year_counter = year_counter + 1
  	}else{
  		df_eachyear<- rbind(df_eachyear, nc.temp_df)
  	}
}

write.csv(df_years_combined, "temp_series.csv", row.names = FALSE)

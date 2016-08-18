library(plyr)
library(ggplot2)
library(stringr)
library(stringi)
library(RJSONIO)

#read data
df <- read.csv("data.csv", encoding="utf-8")

#some cleaning
df$sport <- gsub( " *\\(.*?\\) *", "", trimws(df$SPORT))

#get age
df$birth_date <- as.Date(df$DOB, "%m/%d/%Y")
df$age <- as.numeric((as.Date("2016-07-05") - df$birth_date) / 365.25)

#### this part is for pre test
#filter sports with minimum 20 athletes
dfSubset <- df %>% group_by(sport) %>% filter(n() >= 20)

#draw a chart
chart <- ggplot(dfSubset, aes(age)) + 
  geom_histogram(breaks=seq(15, 50, by = 1), aes(fill=GENDER) ) + 
  facet_grid(sport ~ ., scales = "fixed", switch="y") + 
  theme(strip.background = element_blank()) +
  ggtitle("TEAM USA: age by sport") + 
  labs(y="Number of Athletes") + 

#save chart as png
png(filename="age.png", 
    units="px", 
    width=600, 
    height=1200, 
    pointsize=12, 
    res=72)
plot(chart)
dev.off()

#get height and weight in metric unit
df$HEIGHT <- str_replace_all(df$HEIGHT, "\"", "")
df$height_foot <- as.numeric(substr(df$HEIGHT, 1, 1))
df$height_inch <- as.numeric(
    unlist(
      lapply(df$HEIGHT, function(x) strsplit(x, "'")[[1]][2])
    )
  )
df$height <- df$height_foot * 30.48 + df$height_inch * 2.54
df$weight <- df$WEIGHT * 0.453592

#scatterplot
dfSubset2 <- df %>% group_by(sport) %>% filter(n() >= 25)
plot <- ggplot(dfSubset2, aes(x = height, y = weight)) +
  geom_point(aes(color = GENDER)) + 
  geom_smooth(method = "lm", se = FALSE) +
  facet_grid(sport ~ ., scales = "fixed", switch="y")
png(filename="weight_height.png", 
    units="px", 
    width=400, 
    height=1200, 
    pointsize=12, 
    res=72)
plot(plot)
dev.off()
### pre part ends

#other values for vis
df$name <- paste(trimws(df$FIRST.NAME), trimws(df$LAST.NAME), sep=" ")
#TODO - add prev medals
prev <- sapply(df$OLYMPIC.EXPERIENCE, function(x) 
      paste(unlist(stri_match_all_regex(x, "\\d{4}")), sep="", collapse=", ")
    )

#create data json file
all_athletes <- data.frame(
  name = df$name,
  prev = prev,
  sport = df$sport,
  events = df$EVENT.POSITION.CLASS,
  height = df$height,
  weight = df$weight,
  gender = df$GENDER,  
  height_original = df$HEIGHT,
  weight_original = df$WEIGHT,
  age = df$age,
  birth_date = df$birth_date
)
count <- as.data.frame(table(df$sport))
avg_age <- tapply(df$age, df$sport, median)
sd <- tapply(df$age, df$sport, range)
sports <- list()
for (i in 1:length(count$Var1)) {
  selected <- subset(all_athletes, sport == count$Var1[i])
  a_list <- list()
  for (j in 1:count$Freq[i]) {
    a <- list (
      name = selected$name[j],
      prev = selected$prev[j],
      gender = selected$gender[j],
      age = selected$age[j],
      birth_date = selected$birth_date[j]
    )
    a_list[j] = list(a)
  }
  s <- list(
    id = i - 1,
    name = count$Var1[i],
    athletes_count = count$Freq[i],
    median_age = unname(avg_age[i]),
    age_range = unlist(unname(sd[i])),
    athletes = a_list
  )
  sports[i] <- list(s)
  j <- 1
}
write(minify(toJSON(sports)), "../webapp/public/data/data.json")

#athletes data
athletes_list <- list()
for (i in 1:nrow(all_athletes)) {
    a <- list (
      name = all_athletes$name[i],
      id = i - 1,
      sport = all_athletes$sport[i],
      #prev = all_athletes$prev[i],      
      #birth_date = all_athletes$birth_date[i],
      #events = all_athletes$events[i],
      height = all_athletes$height[i],
      weight = all_athletes$weight[i],
      gender = all_athletes$gender[i],
      height_original = all_athletes$height_original[i],
      weight_original = all_athletes$weight_original[i],
      age = all_athletes$age[i]
    )
    athletes_list[i] = list(a)
}
write(minify(toJSON(athletes_list)), "../webapp2/public/data/athletes.json")